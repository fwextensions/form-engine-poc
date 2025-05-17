// Export types
export type { FieldComponentProps } from "./types";

// Export field components
export { default as TextField } from "./TextField";
export { default as TextareaField } from "./TextareaField";
export { default as SelectField } from "./SelectField";
export { default as CheckboxField } from "./CheckboxField";
export { default as RadioField } from "./RadioField";
export { default as DateField } from "./DateField";

// Export registry
export { registerField, getFieldComponent } from "./FieldRegistry";

// Initialize field registry with default field types
import { registerField } from "./FieldRegistry";
import TextField from "./TextField";
import TextareaField from "./TextareaField";
import SelectField from "./SelectField";
import CheckboxField from "./CheckboxField";
import RadioField from "./RadioField";
import DateField from "./DateField";

// Register default field types
registerField("text", TextField);
registerField("email", TextField);
registerField("password", TextField);
registerField("date", DateField); // Use dedicated DateField component
registerField("textarea", TextareaField);
registerField("select", SelectField);
registerField("checkbox", CheckboxField);
registerField("radio", RadioField);
