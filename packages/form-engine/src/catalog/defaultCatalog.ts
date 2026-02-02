// packages/form-engine/src/catalog/defaultCatalog.ts
// Default catalog containing all built-in form-engine components
import { createCatalog } from "./catalog";
import {
	// Field components
	textEntry,
	emailEntry,
	passwordEntry,
	telEntry,
	numberEntry,
	checkboxEntry,
	selectEntry,
	radiogroupEntry,
	dateEntry,
	textareaEntry,
	fileEntry,
	addressValidationEntry,
	// Layout components
	formEntry,
	pageEntry,
	htmlEntry,
} from "./entries";

/**
 * The default catalog containing all built-in form-engine components.
 * This catalog can be used independently of React for:
 * - Schema validation
 * - JSON Schema generation
 * - Documentation generation
 * - AI prompt construction
 */
export const defaultCatalog = createCatalog({
	components: {
		// Field components
		text: textEntry,
		email: emailEntry,
		password: passwordEntry,
		tel: telEntry,
		number: numberEntry,
		checkbox: checkboxEntry,
		select: selectEntry,
		radiogroup: radiogroupEntry,
		date: dateEntry,
		textarea: textareaEntry,
		file: fileEntry,
		addressValidation: addressValidationEntry,
		// Layout components
		form: formEntry,
		page: pageEntry,
		html: htmlEntry,
	},
});
