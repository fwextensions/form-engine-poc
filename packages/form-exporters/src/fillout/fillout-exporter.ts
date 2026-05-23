/**
 * fillout-exporter.ts
 *
 * Converts a form-engine FormConfig schema into Fillout export JSON (v2).
 * Best-effort: always produces output, with diagnostics for unmappable features.
 */

import type { ExportDiagnostic, ExportResult } from "../types";
import {
  genId,
  shortAnswerTemplate,
  longAnswerTemplate,
  dropdownTemplate,
  multipleChoiceTemplate,
  checkboxTemplate,
  datePickerTemplate,
  numberInputTemplate,
  phoneNumberTemplate,
  passwordTemplate,
  fileUploadTemplate,
  htmlTemplate,
  paragraphTemplate,
  assembleFilloutForm,
  type FilloutWidget,
  type FilloutPage,
  type FilloutSelectOption,
  type WidgetBaseOpts,
} from "./fillout-primitives";

// ─── Schema node types (loosely typed to match form-engine's passthrough schemas) ─

/**
 * A generic schema node from form-engine. We use a loose interface here rather
 * than importing concrete types, so the exporter works with raw parsed schemas
 * regardless of whether the form-engine component modules have been imported.
 */
interface SchemaNode {
  type: string;
  id?: string;
  label?: string;
  description?: string;
  placeholder?: string;
  defaultValue?: unknown;
  disabled?: boolean;
  hidden?: boolean;
  required?: boolean;
  validation?: { required?: boolean; [key: string]: unknown };
  options?: Array<{ label: string; value?: unknown }>;
  rows?: number;
  accept?: string;
  multiple?: boolean;
  min?: unknown;
  max?: unknown;
  content?: string;
  tag?: string;
  className?: string;
  title?: string;
  children?: SchemaNode[];
  rules?: unknown[];
  condition?: unknown;
  [key: string]: unknown;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extract the effective label from a form-engine node, handling the asterisk
 * notation for required fields (e.g. "Name*" -> "Name").
 */
function extractLabel(node: SchemaNode): {
  label: string;
  requiredFromAsterisk: boolean;
} {
  const raw = node.label ?? "";
  const trimmed = raw.trim();
  if (trimmed.endsWith("*")) {
    return { label: trimmed.slice(0, -1).trim(), requiredFromAsterisk: true };
  }
  return { label: trimmed, requiredFromAsterisk: false };
}

/** Determine if a field is required from any source. */
function isRequired(node: SchemaNode): boolean {
  if (node.validation?.required) return true;
  if (node.required) return true;
  const { requiredFromAsterisk } = extractLabel(node);
  return requiredFromAsterisk;
}

/** Build common Fillout widget opts from a form-engine field node. */
function baseOpts(node: SchemaNode): WidgetBaseOpts {
  const { label } = extractLabel(node);
  return {
    required: isRequired(node),
    caption: node.description,
    placeholder: node.placeholder,
    defaultValue:
      node.defaultValue != null ? String(node.defaultValue) : undefined,
    alwaysHide: node.hidden ?? false,
  };
}

/** Normalize options from form-engine format to Fillout format. */
function mapOptions(
  options: Array<{ label: string; value?: unknown }>
): FilloutSelectOption[] {
  return options.map((o) => ({
    label: o.label,
    value: o.value != null ? String(o.value) : o.label,
  }));
}

// ─── Component mappers ────────────────────────────────────────────────────────

type WidgetMapper = (
  node: SchemaNode,
  diagnostics: ExportDiagnostic[]
) => { type: string; template: Record<string, unknown> } | null;

const componentMappers: Record<string, WidgetMapper> = {
  text: (node) => ({
    type: "ShortAnswer",
    template: shortAnswerTemplate(extractLabel(node).label, baseOpts(node)),
  }),

  email: (node) => ({
    type: "EmailInput",
    template: shortAnswerTemplate(extractLabel(node).label, baseOpts(node)),
  }),

  password: (node) => ({
    type: "Password",
    template: passwordTemplate(extractLabel(node).label, baseOpts(node)),
  }),

  tel: (node) => ({
    type: "PhoneNumber",
    template: phoneNumberTemplate(extractLabel(node).label, baseOpts(node)),
  }),

  number: (node) => {
    // min/max are not directly supported in basic Fillout NumberInput
    return {
      type: "NumberInput",
      template: numberInputTemplate(extractLabel(node).label, baseOpts(node)),
    };
  },

  textarea: (node) => ({
    type: "LongAnswer",
    template: longAnswerTemplate(extractLabel(node).label, {
      ...baseOpts(node),
      rows: node.rows,
    }),
  }),

  select: (node, diagnostics) => {
    if (!node.options?.length) {
      diagnostics.push({
        severity: "warning",
        componentId: node.id,
        componentType: "select",
        message: "Select field has no options; exported as empty dropdown.",
      });
    }
    return {
      type: "Dropdown",
      template: dropdownTemplate(
        extractLabel(node).label,
        mapOptions(node.options ?? []),
        baseOpts(node)
      ),
    };
  },

  radiogroup: (node, diagnostics) => {
    if (!node.options?.length) {
      diagnostics.push({
        severity: "warning",
        componentId: node.id,
        componentType: "radiogroup",
        message:
          "RadioGroup field has no options; exported as empty MultipleChoice.",
      });
    }
    return {
      type: "MultipleChoice",
      template: multipleChoiceTemplate(
        extractLabel(node).label,
        mapOptions(node.options ?? []),
        baseOpts(node)
      ),
    };
  },

  checkbox: (node) => ({
    type: "Checkbox",
    template: checkboxTemplate(extractLabel(node).label, baseOpts(node)),
  }),

  date: (node) => ({
    type: "DatePicker",
    template: datePickerTemplate(extractLabel(node).label, baseOpts(node)),
  }),

  file: (node) => ({
    type: "FileUpload",
    template: fileUploadTemplate(extractLabel(node).label, {
      ...baseOpts(node),
      acceptedFileTypes: node.accept,
    }),
  }),

  html: (node) => {
    const content = node.content ?? "";
    // If the html block has a tag like <br> or <hr>, or has significant HTML,
    // use the Html widget. Otherwise use Paragraph for simple text.
    const hasHtmlTags = /<[a-z][\s\S]*>/i.test(content);
    if (hasHtmlTags) {
      return { type: "Html", template: htmlTemplate(content) };
    }
    return { type: "Paragraph", template: paragraphTemplate(content) };
  },
};

// ─── Tree walker ──────────────────────────────────────────────────────────────

/**
 * Process a single field/component node into a Fillout widget.
 * Returns null if the component type is a container (page, form) or unknown.
 */
function processComponent(
  node: SchemaNode,
  diagnostics: ExportDiagnostic[]
): FilloutWidget | null {
  // Emit diagnostics for features we can't map
  if (node.rules?.length) {
    diagnostics.push({
      severity: "warning",
      componentId: node.id,
      componentType: node.type,
      message: `Rules (when/then conditional logic) on "${node.id ?? node.type}" cannot be mapped to Fillout. The field will be exported without conditional behavior.`,
    });
  }
  if (node.condition != null) {
    diagnostics.push({
      severity: "warning",
      componentId: node.id,
      componentType: node.type,
      message: `JSONLogic condition on "${node.id ?? node.type}" cannot be mapped to Fillout. The field will always be visible.`,
    });
  }
  if (node.disabled) {
    diagnostics.push({
      severity: "info",
      componentId: node.id,
      componentType: node.type,
      message: `Disabled state on "${node.id ?? node.type}" has no Fillout equivalent. The field will be editable.`,
    });
  }

  const mapper = componentMappers[node.type];
  if (!mapper) {
    return null;
  }

  const result = mapper(node, diagnostics);
  if (!result) return null;

  return {
    id: genId(),
    name: `${result.type} field`,
    type: result.type,
    position: { row: 0, column: 0 }, // row set by caller
    template: result.template,
  };
}

/**
 * Process a page node's children into Fillout widgets.
 */
function processPage(
  pageNode: SchemaNode,
  diagnostics: ExportDiagnostic[]
): FilloutPage {
  const widgets: FilloutWidget[] = [];
  let row = 0;

  for (const child of pageNode.children ?? []) {
    const widget = processComponent(child, diagnostics);
    if (widget) {
      widget.position.row = row++;
      widgets.push(widget);
    }
  }

  return {
    id: genId(),
    name: pageNode.title ?? "Untitled Page",
    widgets,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface FilloutExportOptions {
  /** Theme customization for the exported form. */
  theme?: {
    primaryColor?: string;
    backgroundColor?: string;
    questionsColor?: string;
    answersColor?: string;
    questionsBackgroundColor?: string;
  };
}

/**
 * Export a form-engine schema to Fillout export JSON (v2).
 *
 * Accepts the raw parsed schema object (the result of `parseRootFormSchema().config`
 * or equivalently a plain object with `type: "form"` and `children`).
 *
 * Always produces output. Unmappable features generate diagnostics.
 *
 * @example
 * ```ts
 * import { parseRootFormSchema } from "form-engine";
 * import { exportToFillout } from "form-exporters";
 *
 * const { config } = parseRootFormSchema(yamlData);
 * const { output, diagnostics } = exportToFillout(config);
 *
 * if (diagnostics.length) {
 *   console.warn("Export warnings:", diagnostics);
 * }
 * fs.writeFileSync("form.json", JSON.stringify(output, null, 2));
 * ```
 */
export function exportToFillout(
  schema: SchemaNode,
  options: FilloutExportOptions = {}
): ExportResult<Record<string, unknown>> {
  const diagnostics: ExportDiagnostic[] = [];

  if (schema.type !== "form") {
    diagnostics.push({
      severity: "warning",
      componentType: schema.type,
      message: `Expected root type "form" but got "${schema.type}". Attempting export anyway.`,
    });
  }

  const children = schema.children ?? [];
  const pages: FilloutPage[] = [];

  // Check if the form has page children (multi-page) or just fields (single-page)
  const hasPages = children.some((child: SchemaNode) => child.type === "page");

  if (hasPages) {
    for (const child of children) {
      if (child.type === "page") {
        pages.push(processPage(child, diagnostics));
      } else {
        // Non-page children at the form root level in a multi-page form
        diagnostics.push({
          severity: "warning",
          componentId: child.id,
          componentType: child.type,
          message: `Component "${child.id ?? child.type}" is at the form root level alongside pages. It will be skipped in the Fillout export.`,
        });
      }
    }
  } else {
    // Single-page form: wrap all children in one page
    const syntheticPage: SchemaNode = {
      type: "page",
      title: schema.title ?? "Form",
      children,
    };
    pages.push(processPage(syntheticPage, diagnostics));
  }

  if (pages.length === 0) {
    // Edge case: no pages and no fields. Create an empty page.
    pages.push({
      id: genId(),
      name: schema.title ?? "Empty Form",
      widgets: [],
    });
    diagnostics.push({
      severity: "warning",
      message: "Form has no fields. Exported as an empty Fillout form.",
    });
  }

  const output = assembleFilloutForm(pages, { theme: options.theme });

  return { output, diagnostics };
}
