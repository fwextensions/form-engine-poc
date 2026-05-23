/**
 * fillout-primitives.ts
 *
 * Low-level Fillout export JSON structure builders.
 * Produces the v2 Fillout export format without depending on the
 * external fillout-form-json repo.
 *
 * Adapted from the FilloutFormBuilder reverse-engineered format.
 */

import { randomBytes } from "crypto";

// ─── ID generation ─────────────────────────────────────────────────────────────

export function genId(): string {
  return randomBytes(16).toString("base64url").slice(0, 22);
}

// ─── Logic field primitives ────────────────────────────────────────────────────

type LogicPickerString = {
  logic: { value: string; references: Record<string, never> };
  expectedTypes: string[];
  ___LOGIC_TYPE___: "pickerString";
};

type LogicBool = {
  logic: boolean | { and: never[] };
  expectedTypes: ["boolean"];
  ___LOGIC_TYPE___: "logic";
};

export function ps(
  value: string,
  expectedTypes: string[] = ["string"]
): LogicPickerString {
  return {
    logic: { value, references: {} },
    expectedTypes,
    ___LOGIC_TYPE___: "pickerString",
  };
}

export const falseLogic: LogicBool = {
  logic: false,
  expectedTypes: ["boolean"],
  ___LOGIC_TYPE___: "logic",
};

export const trueLogic: LogicBool = {
  logic: true,
  expectedTypes: ["boolean"],
  ___LOGIC_TYPE___: "logic",
};

export const emptyCondition: LogicBool = {
  logic: { and: [] as never[] },
  expectedTypes: ["boolean"],
  ___LOGIC_TYPE___: "logic",
};

// ─── Widget base options ──────────────────────────────────────────────────────

export interface WidgetBaseOpts {
  required?: boolean;
  caption?: string;
  alwaysHide?: boolean;
  defaultValue?: string;
  placeholder?: string;
}

export function widgetBase(opts: WidgetBaseOpts = {}) {
  return {
    regex: ps(""),
    caption: ps(opts.caption ?? ""),
    inHeader: false,
    required: opts.required ? trueLogic : falseLogic,
    condition: emptyCondition,
    maxLength: ps("", ["number"]),
    minLength: ps("", ["number"]),
    alwaysHide: opts.alwaysHide ?? false,
    showOrHide: "show_when" as const,
    validationPattern: "none" as const,
    showOrHideCondition: emptyCondition,
    validationErrorMessage: ps(""),
  };
}

// ─── Widget option helpers ────────────────────────────────────────────────────

export interface FilloutSelectOption {
  label: string;
  value?: string;
}

export function makeOptions(choices: FilloutSelectOption[]) {
  return {
    staticOptions: choices.map((o) => ({
      id: genId(),
      label: ps(o.label),
      value: ps(o.value ?? o.label),
    })),
  };
}

// ─── Widget template factories ────────────────────────────────────────────────

export function shortAnswerTemplate(
  label: string,
  opts: WidgetBaseOpts = {}
) {
  return {
    label: ps(label),
    ...widgetBase(opts),
    placeholder: ps(opts.placeholder ?? ""),
    defaultValue: ps(opts.defaultValue ?? "", ["string", "null"]),
  };
}

export function longAnswerTemplate(
  label: string,
  opts: WidgetBaseOpts & { rows?: number } = {}
) {
  return {
    label: ps(label),
    ...widgetBase(opts),
    rows: ps(String(opts.rows ?? 4), ["number"]),
    placeholder: ps(opts.placeholder ?? ""),
    showCounter: true,
    defaultValue: ps(opts.defaultValue ?? ""),
  };
}

export function dropdownTemplate(
  label: string,
  choices: FilloutSelectOption[],
  opts: WidgetBaseOpts = {}
) {
  return {
    label: ps(label),
    ...widgetBase(opts),
    options: makeOptions(choices),
    placeholder: ps(opts.placeholder ?? ""),
    defaultValue: ps(opts.defaultValue ?? "", ["string", "null"]),
    optionsToShow: [] as never[],
    optionsMappings: false,
    randomizeOptionsOrder: false,
  };
}

export function multipleChoiceTemplate(
  label: string,
  choices: FilloutSelectOption[],
  opts: WidgetBaseOpts = {}
) {
  return {
    label: ps(label),
    ...widgetBase(opts),
    theme: "bubble",
    layout: "wrap",
    options: makeOptions(choices),
    defaultValue: ps(opts.defaultValue ?? "", ["string", "null"]),
    optionsToShow: [] as never[],
    optionsMappings: false,
    randomizeOptionsOrder: false,
  };
}

export function checkboxTemplate(
  label: string,
  opts: WidgetBaseOpts = {}
) {
  return {
    label: ps(label),
    ...widgetBase(opts),
    sublabel: ps(opts.caption ?? ""),
    defaultValue: falseLogic,
  };
}

export function datePickerTemplate(
  label: string,
  opts: WidgetBaseOpts = {}
) {
  return {
    label: ps(label),
    ...widgetBase(opts),
    maxDate: ps(""),
    minDate: ps(""),
    dateFormat: "MM/DD/YYYY",
    dateOffset: 0,
    placeholder: ps(opts.placeholder ?? ""),
    defaultValue: ps(opts.defaultValue ?? ""),
  };
}

export function numberInputTemplate(
  label: string,
  opts: WidgetBaseOpts = {}
) {
  return {
    label: ps(label),
    ...widgetBase(opts),
    placeholder: ps(opts.placeholder ?? ""),
    defaultValue: ps(opts.defaultValue ?? "", ["number", "null"]),
  };
}

export function phoneNumberTemplate(
  label: string,
  opts: WidgetBaseOpts = {}
) {
  return {
    label: ps(label),
    ...widgetBase(opts),
    placeholder: ps(opts.placeholder ?? ""),
    defaultValue: ps(opts.defaultValue ?? "", ["string", "null"]),
    defaultCountry: ps(""),
    userVerification: false,
    hasDefaultCountry: false,
    hideCountrySelection: false,
  };
}

export function passwordTemplate(
  label: string,
  opts: WidgetBaseOpts = {}
) {
  return {
    label: ps(label),
    ...widgetBase(opts),
    placeholder: ps(opts.placeholder ?? ""),
    defaultValue: ps(opts.defaultValue ?? ""),
  };
}

export function fileUploadTemplate(
  label: string,
  opts: WidgetBaseOpts & { maxFiles?: number; acceptedFileTypes?: string } = {}
) {
  return {
    label: ps(label),
    ...widgetBase(opts),
    maxFiles: ps(String(opts.maxFiles ?? 5), ["number"]),
    minFiles: ps("", ["number"]),
    maxFileSize: null,
    defaultValue: ps("", ["array"]),
    showUploadLimits: false,
    acceptedFileTypes: ps(opts.acceptedFileTypes ?? ""),
    acceptedMimeTypes: null,
  };
}

export function htmlTemplate(htmlContent: string) {
  return {
    css: ps(""),
    html: ps(htmlContent),
    inHeader: false,
    alwaysHide: false,
    showOrHide: "show_when" as const,
    allowScripts: false,
    enableIframe: true,
    showOrHideCondition: emptyCondition,
  };
}

export function paragraphTemplate(html: string) {
  return {
    contents: ps(html),
    inHeader: false,
    alwaysHide: false,
    showOrHide: "show_when" as const,
    showOrHideCondition: emptyCondition,
  };
}

export function buttonTemplate(label = "Next") {
  return {
    text: ps(label),
    inHeader: false,
    alignment: "left",
    alwaysHide: false,
    showOrHide: "show_when" as const,
    showBackButton: true,
    showSkipButton: false,
    backgroundColor: "",
    skipValidations: false,
    disabled: emptyCondition,
    nextStep: { isFinal: false, branches: [], defaultNextStep: "" },
    showOrHideCondition: emptyCondition,
  };
}

// ─── Page & Form assembly ─────────────────────────────────────────────────────

export interface FilloutWidget {
  id: string;
  name: string;
  type: string;
  position: { row: number; column: number };
  template: Record<string, unknown>;
}

export interface FilloutPage {
  id: string;
  name: string;
  widgets: FilloutWidget[];
}

export interface FilloutThemeOptions {
  primaryColor?: string;
  backgroundColor?: string;
  questionsColor?: string;
  answersColor?: string;
  questionsBackgroundColor?: string;
  formWidth?: number;
  formSizing?: "small" | "medium" | "large";
  formPosition?: "center_with_banner" | "center" | "left";
}

const DEFAULT_THEME: Required<FilloutThemeOptions> = {
  primaryColor: "rgba(74, 194, 212, 1)",
  backgroundColor: "#f3f4f6",
  questionsColor: "#374151",
  answersColor: "#4b5563",
  questionsBackgroundColor: "#fff",
  formWidth: 79,
  formSizing: "small",
  formPosition: "center_with_banner",
};

/**
 * Assemble pages and widgets into a complete Fillout export JSON (v2).
 */
export function assembleFilloutForm(
  pages: FilloutPage[],
  options: { theme?: FilloutThemeOptions } = {}
): Record<string, unknown> {
  if (pages.length === 0) {
    throw new Error("Form must have at least one page");
  }

  const endingId = genId();
  const themeId = genId();
  const steps: Record<string, unknown> = {};

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const isFinal = i === pages.length - 1;
    const nextId = isFinal ? endingId : pages[i + 1].id;

    // Build widgets record
    const widgetsRecord: Record<string, unknown> = {};
    for (const widget of page.widgets) {
      widgetsRecord[widget.id] = widget;
    }

    // Check if page has a Button widget; if not, add one
    const hasButton = page.widgets.some((w) => w.type === "Button");
    if (!hasButton) {
      const btnId = genId();
      const btnTemplate = buttonTemplate(isFinal ? "Submit" : "Next");
      btnTemplate.nextStep = {
        isFinal,
        branches: [],
        defaultNextStep: isFinal ? "" : nextId,
      };
      widgetsRecord[btnId] = {
        id: btnId,
        name: "Button field",
        type: "Button",
        position: { row: page.widgets.length, column: 0 },
        template: btnTemplate,
      };
    }

    // Patch Button nextStep pointers
    for (const widget of Object.values(widgetsRecord) as any[]) {
      if (widget.type === "Button") {
        widget.template.nextStep = {
          isFinal,
          branches: [],
          defaultNextStep: isFinal ? "" : nextId,
        };
      }
    }

    steps[page.id] = {
      id: page.id,
      name: page.name,
      type: "form",
      nextStep: {
        isFinal: false,
        branches: [],
        defaultNextStep: nextId,
      },
      template: { widgets: widgetsRecord },
    };
  }

  // Ending page
  const tyId = genId();
  steps[endingId] = {
    id: endingId,
    name: "Ending",
    type: "ending",
    nextStep: { isFinal: true, branches: [], defaultNextStep: "" },
    template: {
      type: "thank_you",
      widgets: {
        [tyId]: {
          id: tyId,
          name: "thankYou1",
          type: "ThankYou",
          position: { row: 1 },
          template: {
            alwaysHide: false,
            showOrHide: "show_when",
            hideBranding: false,
            richTitleText: ps("Thank you"),
            showQuizScore: true,
            richSubtitleText: ps("<p>Your form has been submitted.</p>"),
            showOrHideCondition: emptyCondition,
            showSchedulingDetails: true,
          },
        },
      },
      confetti: true,
    },
  };

  // Theme
  const t = { ...DEFAULT_THEME, ...(options.theme ?? {}) };
  const themeValues: Record<string, unknown> = {
    formWidth: t.formWidth,
    formSizing: t.formSizing,
    answersColor: t.answersColor,
    formPosition: t.formPosition,
    primaryColor: t.primaryColor,
    questionsColor: t.questionsColor,
    backgroundColor: t.backgroundColor,
    imageBrightness: 1,
    questionsBackgroundColor: t.questionsBackgroundColor,
  };

  return {
    ___FILLOUT_EXPORT_VERSION___: 2,
    template: {
      steps,
      quizzes: {
        answers: {},
        enabled: false,
        settings: { disableShowingCorrectAnswers: false },
      },
      settings: { progressBar: { shouldHide: false } },
      firstStep: pages[0].id,
      urlParams: [],
      calculations: {},
      integrations: {},
      themePublicId: themeId,
      featuredThemeId: "plain",
    },
    settings: {},
    theme: {
      publicIdentifier: themeId,
      name: "Generated theme",
      values: themeValues,
    },
    workflows: [],
    type: "form",
  };
}
