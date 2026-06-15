/**
 * fillout-primitives.ts
 *
 * Low-level Fillout export JSON structure builders.
 * Produces the v2 Fillout export format without depending on the
 * external fillout-form-json repo.
 *
 * Adapted from the FilloutFormBuilder reverse-engineered format.
 */

// ─── ID generation ─────────────────────────────────────────────────────────────

export function genId(): string {
  const bytes = new Uint8Array(16);
  if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    // Node.js fallback
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { randomBytes } = require("crypto") as typeof import("crypto");
    const buf = randomBytes(16);
    bytes.set(buf);
  }
  // Base64url encode without padding, matching Fillout's 22-char IDs
  const base64 = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return base64.slice(0, 22);
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
  opts: WidgetBaseOpts & { theme?: "bubble" | "standard" | "default"; layout?: "wrap" | "column" | "single_column" } = {}
) {
  return {
    label: ps(label),
    ...widgetBase(opts),
    theme: opts.theme ?? "standard",
    layout: opts.layout ?? "single_column",
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

export function buttonTemplate(label = "", opts: { showBackButton?: boolean } = {}) {
  return {
    text: ps(label),
    inHeader: false,
    alignment: "left",
    alwaysHide: false,
    showOrHide: "show_when" as const,
    showBackButton: opts.showBackButton ?? true,
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
  backgroundImageUrl?: string;
  formWidth?: number;
  formSizing?: "small" | "medium" | "large";
  formPosition?: "center_with_banner" | "center" | "left" | "default";
}

// ─── SF.gov default theme ─────────────────────────────────────────────────────

/**
 * The fixed SF.gov Fillout theme ("Z. Sandbox (Don't delete)").
 * Using the stable publicIdentifier avoids creating throwaway theme records
 * in the Fillout workspace on every export.
 */
export const SFGOV_THEME_ID = "44374be2-4f57-4d7b-9ace-b5cf686a0a34";

const SFGOV_CUSTOM_CSS = `/* 
SF.gov Fillout theme
*/

/************************************ 
Alerts/Banners 
************************************/
/* alert container */
.fillout-field-alert .border-blue-400 {
  border: 1px solid #0046c2;
  border-radius: 0px;
  background-color: #e5f1ff;
  padding: 28px;
}

/* alert inner container */
.fillout-field-alert .flex.items-center .flex-col {
  flex-direction: row;
}

/* alert icon */
.fillout-field-alert .text-blue-400 {
  color: #0046c2;
}

/* alert icon placement */
.fillout-field-alert .flex.items-center {
  align-items: flex-start;
}

/* alert title */
.fillout-field-alert .ql-editor strong {
/*  color: #0046c2; */
/*  background-color: #e5f1ff; */
}

/* alert text */
.fillout-field-alert .ql-editor p {
  color: #0b0c0c;
  background-color: inherit;
}

/************************************
Buttons
************************************/

.fillout-field-button div {
  text-align: center;
  font-family: "Roboto Flex", sans-serif;
  font-size: 14px;
  font-style: normal;
  font-weight: 500;
  line-height: 20px;
}

/* next/primary button */
.fillout-field-button button {
  height: 40px;
  padding: 15px 16px;
  border-radius: 4px;
  border: 1px solid #1b519e;
  background-color: #1b519e;
  box-shadow: none;
  color: #fcfcfc;
  
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
}

.fillout-field-button button:hover {
  border-color: #001d4e;
  background-color: #001d4e;
}

.fillout-field-button button:focus {
  outline: 3px solid #2a60af;
  box-shadow: none;
}

/* back/secondary button */
.fillout-back-button button {
  border-radius: 4px;
  border: 1px solid #dfebfd;
  background-color: #dfebfd;
  color: #000925;
}
.fillout-back-button button:hover {
  border: 1px solid #afccf7;
  background-color: #afccf7;
}

/* button spacing */
.fillout-field-button > .justify-start {
  justify-content: space-between;
}

/************************************
Checkboxes
************************************/
.fillout-field-checkbox button,
.fillout-field-checkbox button > svg,
.fillout-field-checkboxes button,
.fillout-field-checkboxes button > svg {
  height: 40px;
  width: 40px;
}

.fillout-field-checkbox button[aria-checked="true"],
.fillout-field-checkboxes button[aria-checked="true"] {
  background-color: #386ebf;
}

.fillout-field-checkboxes fieldset {
  gap: 16px;
}

/************************************
Dropdown/select
************************************/
.react-select__indicator {
  color: #0b0c0c;
}

/************************************
Error messages
************************************/
.fillout-error-validation-message {
  color: #ac0000;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
}

/************************************
Navigation/progress bar
************************************/
nav .group .step-name {
  color: #0b0c0c !important;
}

/************************************
Multiple choice
************************************/
.fillout-field-multiple-choice [role="radio"] {
  margin: 16px 16px 16px 12px;
}
.fillout-field-multiple-choice span.bg-white {
  height: 40px !important;
  width: 40px !important;
}

.fillout-field-multiple-choice span.transition-transform {
  height: 22px !important;
  width: 22px !important;
  color: #386ebf !important;
}

/************************************
Spacing
************************************/
#question-alignment-container.h-full {
  height: fit-content;
}

#question-alignment-container & > :not(:last-child) {
  --tw-space-y-reverse: 0;
  margin-block-start: calc(
    calc(var(--spacing) * 40) * var(--tw-space-y-reverse)
  );
  margin-block-end: calc(
    calc(var(--spacing) * 40) * calc(1 - var(--tw-space-y-reverse))
  );
}

/************************************
Switch
************************************/
.fillout-field-switch .ant-switch:focus {
  outline: 3px solid #2a60af;
  outline-offset: 4px;
  transition: none;
}

/************************************
Text
************************************/

.fillout-field-text h1 {
  font-family: "Roboto Slab", sans-serif;
  font-style: normal;
  color: #0b0c0c;
  padding-bottom: 20px;
  font-weight: 600;
  font-size: 46px;
  line-height: 56px;
}

.fillout-field-text h2 {
  font-family: "Roboto Slab", sans-serif;
  font-style: normal;
  color: #0b0c0c;
  font-weight: 500;
  font-size: 40px;
  line-height: 52px;
}

.fillout-field-text h3 {
  font-family: "Roboto Slab", sans-serif;
  font-style: normal;
  color: #0b0c0c;
  font-weight: 600;
  font-size: 32px;
  line-height: 44px;
}

.fillout-field-text h4 {
  font-family: "Roboto Slab", sans-serif;
  font-style: normal;
  color: #0b0c0c;
  font-weight: 500;
  font-size: 24px;
  line-height: 32px;
}

.fillout-field-text h5 {
  font-family: "Roboto Slab", sans-serif;
  font-style: normal;
  color: #0b0c0c;
  font-weight: 500;
  font-size: 20px;
  line-height: 28px;
}

div,
span,
p {
  font-family: "Open Sans", sans-serif;
  font-style: normal;
}

.fillout-field-paragraph h1 {
  font-weight: 600;
  font-size: 32px;
  line-height: 44px;
}

.fillout-field-paragraph h2 {
  font-weight: 600;
  font-size: 24px;
  line-height: 32px;
}

.fillout-field-paragraph h3 {
  font-weight: 600;
  font-size: 20px;
  line-height: 28px;
}

.fillout-field-paragraph h4 {
  font-weight: 700;
  font-size: 16px;
  line-height: 24px;
/*  text-transform: uppercase; */
}

.fillout-field-paragraph h5 {
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
}

.fillout-field-paragraph p {
  font-weight: 400;
  font-size: 16px;
  line-height: 24px;
}

.fillout-field-label p {
  color: #0b0c0c;
  font-size: 20px;
  line-height: 28px;
}

.fillout-field-container input[type],
.fillout-field-container input[placeholder],
.fillout-field-container label[type],
.fillout-field-container span[placeholder],
.fillout-field-container textarea[placeholder],
.fillout-field-multiple-choice [role="radio"] div,
.fillout-field-checkboxes label div,
.react-select__value-container .react-select__single-value {
  color: #0b0c0c !important;
}

.fillout-caption,
input::placeholder {
  color: #535454;
}

a {
  color: #2a60af;
}

.fillout-required-asterisk,
p::after {
  color: #ac0000;
}
`;

const SFGOV_THEME_VALUES = {
  bold: false,
  font: {
    type: "google_font",
    googleFont: { name: "Roboto Slab" },
  },
  customCSS: SFGOV_CUSTOM_CSS,
  formSizing: "medium" as const,
  answersColor: "rgba(89, 89, 92, 1)",
  formPosition: "default" as const,
  primaryColor: "rgba(27, 81, 158, 1)",
  navBarSettings: {
    type: "image_url",
    imageUrl:
      "https://images.fillout.com/orgid-356179/flowpublicid-96oVd4FyLUus/widgetid-undefined/bJJZHLsrVEePfdpBGnE7w7/DeviceDesktop-ColorBlack(2).png?a=krg6oCqPLZXu1DSkfXkTp3",
    showLogo: true,
  },
  questionsColor: "rgba(11, 12, 12, 1)",
  backgroundColor: "rgba(252, 252, 252, 1)",
  containerBorder: false,
  imageBrightness: 1,
  backButtonPosition: "near_next_button",
  verticalFieldPadding: 3.75,
  questionsBackgroundColor: "rgba(252, 252, 252, 1)",
};

/**
 * Assemble pages and widgets into a complete Fillout export JSON (v2).
 */
export function assembleFilloutForm(
  pages: FilloutPage[],
  options: {
    theme?: FilloutThemeOptions;
    thankYouTitle?: string;
    thankYouBody?: string;
    confetti?: boolean;
    themePublicId?: string;
    omitThemeObject?: boolean;
  } = {}
): Record<string, unknown> {
  if (pages.length === 0) {
    throw new Error("Form must have at least one page");
  }

  const endingId = genId();
  const themePublicId = options.themePublicId ?? SFGOV_THEME_ID;
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
      const btnLabel = i === 0 ? "Get started" : "";
      const btnTemplate = buttonTemplate(btnLabel, { showBackButton: i > 0 });
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

    // Patch Button nextStep pointers (preserve existing branches)
    for (const widget of Object.values(widgetsRecord) as any[]) {
      if (widget.type === "Button") {
        const existingBranches = widget.template?.nextStep?.branches ?? [];
        widget.template.nextStep = {
          isFinal,
          branches: existingBranches,
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
            richTitleText: ps(options.thankYouTitle ?? "Thank you"),
            showQuizScore: true,
            richSubtitleText: ps(
              options.thankYouBody ?? "<p>Made with Fillout</p>"
            ),
            showOrHideCondition: emptyCondition,
            showSchedulingDetails: true,
          },
        },
      },
      confetti: options.confetti ?? true,
    },
  };

  // Theme — use the SF.gov theme by default; callers can override via options.theme
  const themeValues: Record<string, unknown> = {
    ...SFGOV_THEME_VALUES,
    ...(options.theme ?? {}),
  };

  const themeObject = {
    publicIdentifier: themePublicId,
    name: "Z. Sandbox (Don't delete)",
    values: themeValues,
  };

  return {
    ___FILLOUT_EXPORT_VERSION___: 2,
    type: "form",
    template: {
      steps,
      firstStep: pages[0].id,
      themePublicId,
      quizzes: {
        answers: {},
        enabled: false,
        settings: { disableShowingCorrectAnswers: false },
      },
      settings: { progressBar: { shouldHide: false } },
      urlParams: [],
      calculations: {},
      integrations: {},
    },
    ...(options.omitThemeObject ? {} : { theme: themeObject }),
    settings: {},
    workflows: [],
  };
}
