// packages/form-engine/src/catalog/entries/index.ts
// Barrel export for all catalog entries

// Field components
export { checkboxEntry, checkboxConfigSchema, type CheckboxConfig } from "./checkbox";
export {
	textEntry, textConfigSchema, type TextConfig,
	emailEntry, emailConfigSchema, type EmailConfig,
	passwordEntry, passwordConfigSchema, type PasswordConfig,
	telEntry, telConfigSchema, type TelConfig,
	numberEntry, numberConfigSchema, type NumberConfig,
} from "./text";
export { selectEntry, selectConfigSchema, selectOptionSchema, type SelectConfig, type SelectOption } from "./select";
export { radiogroupEntry, radiogroupConfigSchema, radioOptionSchema, type RadioGroupConfig, type RadioOption } from "./radiogroup";
export { dateEntry, dateConfigSchema, type DateConfig } from "./date";
export { textareaEntry, textareaConfigSchema, type TextareaConfig } from "./textarea";
export { fileEntry, fileConfigSchema, type FileConfig } from "./file";
export { addressValidationEntry, addressValidationConfigSchema, type AddressValidationConfig } from "./addressValidation";

// Layout components
export { formEntry, formConfigSchema, type FormConfig } from "./form";
export { pageEntry, pageConfigSchema, type PageConfig } from "./page";
export { htmlEntry, htmlConfigSchema, type HtmlConfig } from "./html";
