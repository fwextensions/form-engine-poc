// packages/form-engine/src/components/fields/Text.tsx
import React from "react";
import { z } from "zod";
import { baseFieldConfigSchema } from "../baseSchemas";
import { createComponent, FormEngineContext } from "../../core/componentFactory";
import { FormFieldContainer, FormFieldContainerProps } from "../layout/FormFieldContainer";

// 1. Define Configuration Schema
export const TextConfigSchema = baseFieldConfigSchema.extend({
	type: z.literal("text"),
	placeholder: z.string().optional(),
	defaultValue: z.string().optional(),
	// If 'required' is to be part of the config, add it here:
	// validation: z.object({ required: z.boolean().optional() }).optional(),
});
export type TextConfig = z.infer<typeof TextConfigSchema>;

// 2. Define Props for the React Component
export interface TextProps {
	containerProps: Omit<FormFieldContainerProps, "children">;
	inputProps: React.InputHTMLAttributes<HTMLInputElement>;
}

// 3. Create the React Component
export const Text: React.FC<TextProps> = ({ containerProps, inputProps }) => {
	return (
		<FormFieldContainer {...containerProps}>
			<input
				{...inputProps}
				className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${inputProps.className || ""}`}
			/>
		</FormFieldContainer>
	);
};

// 4. Register the Component
createComponent<TextConfig, TextProps>({
	type: "text",
	schema: TextConfigSchema,
	component: Text,
	transformProps: (config: TextConfig, context: FormEngineContext): TextProps => {
		const { id, name, label, description, placeholder, defaultValue, type, ...restConfig } = config;
		const fieldId = id || name; // Ensure an ID for htmlFor and aria-describedby

		const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
			context.onDataChange(name, event.target.value);
		};

		const messages: FormFieldContainerProps["messages"] = [];
		// Example: if (config.validation?.required && !(context.formData[name])) {
		// messages.push({ type: "custom", message: "This field is required by custom logic." });
		// }

		// Determine if the field should be marked as required for native HTML5 validation
		// This could be based on a `config.validation.required` or other logic (e.g. label ending with '*')
		// For now, we are not explicitly setting inputProps.required based on config here.
		// The FormFieldContainer's <Form.Message match="valueMissing"> will work if inputProps.required is true.

		return {
			containerProps: {
				name: name,
				label: label,
				description: description,
				htmlFor: fieldId,
				messages: messages,
				// className: restConfig.containerClassName, // Example if you add such props to schema
			},
			inputProps: {
				id: fieldId,
				name: name,
				type: type, // "text"
				placeholder: placeholder,
				value: context.formData[name] ?? defaultValue ?? "",
				onChange: handleChange,
				"aria-describedby": description ? `${fieldId}-description` : undefined,
				disabled: context.formMode === "view",
				// required: config.validation?.required // Set this if you want native HTML5 validation based on schema
				// className: restConfig.inputClassName, // Example
			},
		};
	},
});
