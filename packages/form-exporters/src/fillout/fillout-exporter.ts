/**
 * fillout-exporter.ts
 *
 * Converts a form-engine schema into Fillout export JSON (v2).
 * Best-effort: always produces output, with diagnostics for unmappable features.
 *
 * The exporter is driven by the form-engine component registry: every node is
 * validated through its component's own schema first (so label asterisks,
 * top-level `required`, option shorthand and any other normalisation happen in
 * exactly one place), and the tree is walked by component `kind` rather than
 * by hard-coded type names.
 */

import { ZodError } from "zod";
import { getComponentDefinition, type ComponentDefinition } from "@fwextensions/form-engine";
import type { ExportDiagnostic, ExportResult } from "../types";
import {
  genId,
  shortAnswerTemplate,
  longAnswerTemplate,
  dropdownTemplate,
  multipleChoiceTemplate,
  checkboxTemplate,
  checkboxesTemplate,
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

// ─── Schema node types ────────────────────────────────────────────────────────

/**
 * A validated form-engine node. Field-specific props are optional because the
 * mappers are keyed by type and only read what their type declares.
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
  validation?: { required?: boolean; [key: string]: unknown };
  options?: Array<{ label: string; value?: unknown }>;
  rows?: number;
  accept?: string;
  multiple?: boolean;
  min?: unknown;
  max?: unknown;
  content?: string;
  title?: string;
  children?: unknown[];
  rules?: unknown[];
  condition?: unknown;
  [key: string]: unknown;
}

/** The raw, unvalidated input shape accepted by `exportToFillout`. */
export interface RawSchemaNode {
  type: string;
  [key: string]: unknown;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function labelOf(node: SchemaNode): string {
  return (node.label ?? "").trim();
}

function isRequired(node: SchemaNode): boolean {
  return node.validation?.required === true;
}

/** Build common Fillout widget opts from a validated field node. */
function baseOpts(node: SchemaNode): WidgetBaseOpts {
  return {
    required: isRequired(node),
    caption: node.description,
    placeholder: node.placeholder,
    defaultValue: node.defaultValue != null ? String(node.defaultValue) : undefined,
    alwaysHide: node.hidden ?? false,
  };
}

/** Options arrive normalised from the engine; Fillout wants string values. */
function mapOptions(options: Array<{ label: string; value?: unknown }>): FilloutSelectOption[] {
  return options.map((o) => ({
    label: o.label,
    value: o.value != null ? String(o.value) : o.label,
  }));
}

/**
 * Validates a raw node through its registered component schema. Falls back to
 * the raw node (with a diagnostic) when the type is unknown or the config does
 * not validate, so export remains best-effort.
 */
function validateNode(
  raw: RawSchemaNode,
  diagnostics: ExportDiagnostic[]
): { node: SchemaNode; definition?: ComponentDefinition } {
  const definition = getComponentDefinition(raw.type);
  if (!definition) {
    return { node: raw as SchemaNode };
  }
  try {
    return { node: definition.validateConfig(raw) as SchemaNode, definition };
  } catch (error) {
    const detail = error instanceof ZodError ? error.issues[0]?.message : String(error);
    diagnostics.push({
      severity: "warning",
      componentId: typeof raw.id === "string" ? raw.id : undefined,
      componentType: raw.type,
      message: `Component "${raw.id ?? raw.type}" has an invalid configuration (${detail}); exported from its raw values.`,
    });
    return { node: raw as SchemaNode, definition };
  }
}

// ─── Component mappers ────────────────────────────────────────────────────────

type MappedWidget = { type: string; template: Record<string, unknown> };

/** A mapper returns one widget, several (composite fields), or null to skip. */
type WidgetMapper = (
  node: SchemaNode,
  diagnostics: ExportDiagnostic[]
) => MappedWidget | MappedWidget[] | null;

const componentMappers: Record<string, WidgetMapper> = {
  text: (node) => ({
    type: "ShortAnswer",
    template: shortAnswerTemplate(labelOf(node), baseOpts(node)),
  }),

  email: (node) => ({
    type: "EmailInput",
    template: shortAnswerTemplate(labelOf(node), baseOpts(node)),
  }),

  password: (node) => ({
    type: "Password",
    template: passwordTemplate(labelOf(node), baseOpts(node)),
  }),

  tel: (node) => ({
    type: "PhoneNumber",
    template: phoneNumberTemplate(labelOf(node), baseOpts(node)),
  }),

  number: (node) => ({
    // min/max are not directly supported in basic Fillout NumberInput
    type: "NumberInput",
    template: numberInputTemplate(labelOf(node), baseOpts(node)),
  }),

  textarea: (node) => ({
    type: "LongAnswer",
    template: longAnswerTemplate(labelOf(node), { ...baseOpts(node), rows: node.rows }),
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
      template: dropdownTemplate(labelOf(node), mapOptions(node.options ?? []), baseOpts(node)),
    };
  },

  radiogroup: (node, diagnostics) => {
    if (!node.options?.length) {
      diagnostics.push({
        severity: "warning",
        componentId: node.id,
        componentType: "radiogroup",
        message: "RadioGroup field has no options; exported as empty MultipleChoice.",
      });
    }
    return {
      type: "MultipleChoice",
      template: multipleChoiceTemplate(labelOf(node), mapOptions(node.options ?? []), baseOpts(node)),
    };
  },

  checkbox: (node) => ({
    type: "Checkbox",
    template: checkboxTemplate(labelOf(node), baseOpts(node)),
  }),

  checkboxgroup: (node, diagnostics) => {
    if (!node.options?.length) {
      diagnostics.push({
        severity: "warning",
        componentId: node.id,
        componentType: "checkboxgroup",
        message: "Checkbox group has no options; exported as empty Checkboxes.",
      });
    }
    return {
      type: "Checkboxes",
      template: checkboxesTemplate(labelOf(node), mapOptions(node.options ?? []), baseOpts(node)),
    };
  },

  yesno: (node) => ({
    type: "MultipleChoice",
    template: multipleChoiceTemplate(
      labelOf(node),
      [
        { label: (node.yesLabel as string | undefined) ?? "Yes", value: "yes" },
        { label: (node.noLabel as string | undefined) ?? "No", value: "no" },
      ],
      { ...baseOpts(node), layout: "wrap", defaultValue: node.defaultValue === true ? "yes" : node.defaultValue === false ? "no" : undefined },
    ),
  }),

  name: (node) => {
    const label = labelOf(node);
    const prefix = label ? `${label}: ` : "";
    const opts = { ...baseOpts(node), placeholder: undefined, defaultValue: undefined };
    const parts: MappedWidget[] = [
      { type: "ShortAnswer", template: shortAnswerTemplate(`${prefix}First name`, opts) },
    ];
    if (node.showMiddleName !== false) {
      parts.push({ type: "ShortAnswer", template: shortAnswerTemplate(`${prefix}Middle name`, { ...opts, required: false }) });
    }
    parts.push({ type: "ShortAnswer", template: shortAnswerTemplate(`${prefix}Last name`, opts) });
    return parts;
  },

  dateOfBirth: (node, diagnostics) => {
    if (node.minAge !== undefined || node.maxAge !== undefined) {
      diagnostics.push({
        severity: "info",
        componentId: node.id,
        componentType: "dateOfBirth",
        message: `Age limits on "${node.id ?? "dateOfBirth"}" (minAge/maxAge) are not enforced by the Fillout date picker.`,
      });
    }
    return {
      type: "DatePicker",
      template: datePickerTemplate(labelOf(node), baseOpts(node)),
    };
  },

  date: (node) => ({
    type: "DatePicker",
    template: datePickerTemplate(labelOf(node), baseOpts(node)),
  }),

  file: (node) => ({
    type: "FileUpload",
    template: fileUploadTemplate(labelOf(node), { ...baseOpts(node), acceptedFileTypes: node.accept }),
  }),

  html: (node) => {
    const content = node.content ?? "";
    // Significant markup goes to the Html widget; plain text to Paragraph.
    const hasHtmlTags = /<[a-z][\s\S]*>/i.test(content);
    if (hasHtmlTags) {
      return { type: "Html", template: htmlTemplate(content) };
    }
    return { type: "Paragraph", template: paragraphTemplate(content) };
  },

  repeater: (node, diagnostics) => {
    diagnostics.push({
      severity: "warning",
      componentId: node.id,
      componentType: "repeater",
      message: `Repeating group "${node.id ?? "repeater"}" has no Fillout equivalent; its fields were exported once, under a heading.`,
    });
    const heading = headingWidget({ ...node, title: labelOf(node) });
    return heading ? { type: heading.type, template: heading.template } : null;
  },

  review: (node, diagnostics) => {
    diagnostics.push({
      severity: "info",
      componentId: node.id,
      componentType: "review",
      message: "Review page omitted: Fillout has no answer-summary widget.",
    });
    return null;
  },

  addressValidation: (node, diagnostics) => {
    diagnostics.push({
      severity: "warning",
      componentId: node.id,
      componentType: "addressValidation",
      message: `Address validation field "${node.id ?? ""}" exported as a single long-answer field; Fillout has no validated-address equivalent.`,
    });
    return {
      type: "LongAnswer",
      template: longAnswerTemplate(labelOf(node), { ...baseOpts(node), rows: 3 }),
    };
  },
};

// ─── Tree walker ──────────────────────────────────────────────────────────────

function emitFeatureDiagnostics(node: SchemaNode, diagnostics: ExportDiagnostic[]) {
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
}

/**
 * Converts one validated leaf node into Fillout widgets (usually one; several
 * for composite fields). Unmapped types produce a diagnostic and no widgets.
 */
function processComponent(node: SchemaNode, diagnostics: ExportDiagnostic[]): FilloutWidget[] {
  emitFeatureDiagnostics(node, diagnostics);

  const mapper = componentMappers[node.type];
  if (!mapper) {
    diagnostics.push({
      severity: "warning",
      componentId: node.id,
      componentType: node.type,
      message: `Component type "${node.type}" has no Fillout mapping and was skipped.`,
    });
    return [];
  }

  const result = mapper(node, diagnostics);
  if (!result) return [];
  const mapped = Array.isArray(result) ? result : [result];

  return mapped.map((widget) => ({
    id: genId(),
    name: `${widget.type} field`,
    type: widget.type,
    position: { row: 0, column: 0 }, // row set by caller
    template: widget.template,
  }));
}

/** A heading widget for a layout group (section) that carries a title or description. */
function headingWidget(node: SchemaNode): FilloutWidget | null {
  const title = typeof node.title === "string" ? node.title.trim() : "";
  const description = typeof node.description === "string" ? node.description.trim() : "";
  if (!title && !description) return null;
  const html = `${title ? `<h3>${escapeHtml(title)}</h3>` : ""}${description ? `<p>${escapeHtml(description)}</p>` : ""}`;
  return { id: genId(), name: "Html field", type: "Html", position: { row: 0, column: 0 }, template: htmlTemplate(html) };
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);
}

/**
 * Collects the widgets for a list of children. Nested layout components (any
 * registered `kind: "layout"` other than a page) are flattened into the same
 * Fillout page, since Fillout has no grouping construct below a page.
 */
function collectWidgets(children: unknown[], diagnostics: ExportDiagnostic[], widgets: FilloutWidget[]) {
  for (const raw of children) {
    if (!raw || typeof raw !== "object" || typeof (raw as RawSchemaNode).type !== "string") {
      diagnostics.push({ severity: "warning", message: "Skipped a child without a component type." });
      continue;
    }
    const { node, definition } = validateNode(raw as RawSchemaNode, diagnostics);
    if (definition?.kind === "layout") {
      const heading = headingWidget(node);
      if (heading) {
        heading.position.row = widgets.length;
        widgets.push(heading);
      }
      collectWidgets(Array.isArray(node.children) ? node.children : [], diagnostics, widgets);
      continue;
    }
    for (const widget of processComponent(node, diagnostics)) {
      widget.position.row = widgets.length;
      widgets.push(widget);
    }
    // A field that contains a template (repeater) contributes its fields once.
    if (definition?.children && Array.isArray(node.children)) {
      collectWidgets(node.children, diagnostics, widgets);
    }
  }
}

function processPage(pageNode: SchemaNode, diagnostics: ExportDiagnostic[]): FilloutPage {
  const widgets: FilloutWidget[] = [];
  collectWidgets(Array.isArray(pageNode.children) ? pageNode.children : [], diagnostics, widgets);
  return {
    id: genId(),
    name: pageNode.title ?? "Untitled Page",
    widgets,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Component types this exporter knows how to map to a Fillout widget. */
export function getSupportedComponentTypes(): string[] {
  return Object.keys(componentMappers);
}

export interface FilloutExportOptions {
  /** Partial theme overrides applied on top of the SF.gov default theme. */
  theme?: import("./fillout-primitives").FilloutThemeOptions;
  /** Custom title for the thank-you page. */
  thankYouTitle?: string;
  /** Custom body HTML for the thank-you page. */
  thankYouBody?: string;
  /** Whether to show confetti on the thank-you page. */
  confetti?: boolean;
  /** Pre-existing Fillout theme public ID to reference. */
  themePublicId?: string;
  /** If true, omit the theme object from the export (use when referencing an existing theme). */
  omitThemeObject?: boolean;
}

/**
 * Export a form-engine schema to Fillout export JSON (v2).
 *
 * Accepts the raw parsed schema object (for example the result of
 * `yaml.load()` or `parseRootFormSchema().config`). Every node is validated
 * through the form-engine registry before mapping.
 *
 * Always produces output. Unmappable features generate diagnostics.
 */
export function exportToFillout(
  schema: RawSchemaNode,
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

  const { node: root } = validateNode(schema, diagnostics);
  const children = Array.isArray(root.children) ? root.children : [];
  const pages: FilloutPage[] = [];

  // Validate direct children once so pages can be told apart from fields.
  const validatedChildren = children
    .filter((c): c is RawSchemaNode => !!c && typeof c === "object" && typeof (c as RawSchemaNode).type === "string")
    .map((c) => validateNode(c, diagnostics));

  const hasPages = validatedChildren.some(({ node }) => node.type === "page");

  if (hasPages) {
    for (const { node } of validatedChildren) {
      if (node.type === "page") {
        pages.push(processPage(node, diagnostics));
      } else {
        diagnostics.push({
          severity: "warning",
          componentId: node.id,
          componentType: node.type,
          message: `Component "${node.id ?? node.type}" is at the form root level alongside pages. It will be skipped in the Fillout export.`,
        });
      }
    }
  } else {
    // Single-page form: wrap all children in one page
    pages.push(processPage({ type: "page", title: root.title ?? "Form", children }, diagnostics));
  }

  if (pages.length === 0) {
    pages.push({ id: genId(), name: root.title ?? "Empty Form", widgets: [] });
    diagnostics.push({
      severity: "warning",
      message: "Form has no fields. Exported as an empty Fillout form.",
    });
  }

  const output = assembleFilloutForm(pages, {
    theme: options.theme,
    thankYouTitle: options.thankYouTitle,
    thankYouBody: options.thankYouBody,
    confetti: options.confetti,
    themePublicId: options.themePublicId,
    omitThemeObject: options.omitThemeObject,
  });

  return { output, diagnostics };
}
