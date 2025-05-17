// Re-export types
export type {
	FieldComponentProps,
	FieldDefinition,
	FieldComponent,
	RegisterFieldFn,
} from "./types";

// Export field components
export { default as TextField } from "./TextField";
export { default as TextareaField } from "./TextareaField";
export { default as SelectField } from "./SelectField";
export { default as CheckboxField } from "./CheckboxField";
export { default as RadioField } from "./RadioField";
export { default as DateField } from "./DateField";

// Export styles
export {
	inputStyles,
	labelStyles,
	formMessageStyles,
	fieldSpacing,
	fieldContainer,
	focusRing,
	transition,
	borderRadius,
} from "./styles";

// Import and register field components
import "./TextField";
import "./TextareaField";
import "./SelectField";
import "./CheckboxField";
import "./RadioField";
import "./DateField";

// Import the field registry
import fieldRegistry from "./FieldRegistry";

// Export the field registry API
export const {
	registerField,
	getFieldDefinition,
	getFieldComponent,
	hasFieldType,
	getRegisteredTypes,
} = fieldRegistry;

// Export the default field registry instance
export default fieldRegistry;
