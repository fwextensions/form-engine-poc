import React from "react";
import { FormComponent } from "../services/schemaParser"; // Adjusted path

// Props that every registered component will receive
export interface RegisteredComponentProps {
	component: FormComponent; // The schema definition for this component
	formData: Record<string, any>; // Current overall form data
	onFieldChange: (fieldId: string, value: any) => void; // Callback to update form data
	// path?: string; // Optional: for deeply nested data, if needed later
}

export type RegisteredComponentType = React.FC<RegisteredComponentProps>;

const componentRegistry = new Map<string, RegisteredComponentType>();

export const registerComponent = (
	type: string,
	component: RegisteredComponentType
): void => {
	if (componentRegistry.has(type)) {
		console.warn(`Component type "${type}" is already registered. Overwriting.`);
	}
	componentRegistry.set(type, component);
};

export const getComponent = (
	type: string
): RegisteredComponentType | undefined => {
	if (!componentRegistry.has(type)) {
		// It's better to throw an error or return a specific fallback component
		// For now, a console warning and undefined is kept from original logic
		console.warn(`No component registered for type "${type}". You might see a blank space or an error in the form.`);
		return undefined;
	}
	return componentRegistry.get(type);
};

// --- Component Imports ---
// Containers
import PageRenderer from "./containers/PageRenderer";

// Fields (assuming these will be refactored to be default exports of wrapper components)
import TextField from "./fields/TextField";
import TextareaField from "./fields/TextareaField";
import SelectField from "./fields/SelectField";
import CheckboxField from "./fields/CheckboxField";
import RadioField from "./fields/RadioField";
import DateField from "./fields/DateField";

// --- Register Components ---

// Container Components
registerComponent("page", PageRenderer);

// Field Components
// TextField handles multiple input types based on schema's field.type
registerComponent("text", TextField);
registerComponent("email", TextField);
registerComponent("password", TextField);
registerComponent("tel", TextField);
registerComponent("url", TextField);
registerComponent("number", TextField);

registerComponent("textarea", TextareaField);
registerComponent("select", SelectField);
registerComponent("checkbox", CheckboxField);
registerComponent("radio", RadioField);
registerComponent("date", DateField);

// TODO: Add other components like 'file', 'customHtml', etc. in the future.
