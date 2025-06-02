// packages/form-engine/src/components/fields/Textarea.tsx
import React from "react";
import { z } from "zod";
import { baseFieldConfigSchema } from "../baseSchemas";
import { createComponent, FormEngineContext } from "../../core/componentFactory";
import { FormFieldContainer, FormFieldContainerProps } from "../layout/FormFieldContainer";

// 1. Define Configuration Schema
export const TextareaConfigSchema = baseFieldConfigSchema.extend({
	type: z.literal("textarea"),
	placeholder: z.string().optional(),
	defaultValue: z.string().optional(),
	rows: z.number().optional(),
	// validation: z.object({ required: z.boolean().optional() }).optional(),
});
export type TextareaConfig = z.infer<typeof TextareaConfigSchema>;

// 2. Define Props for the React Component
export interface TextareaProps {
	containerProps: Omit<FormFieldContainerProps, "children">;
	textareaProps: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
}

// 3. Create the React Component
export const Textarea: React.FC<TextareaProps> = ({ containerProps, textareaProps }) => {
	return (
		<FormFieldContainer {...containerProps}>
			<textarea
				{...textareaProps}
				className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${textareaProps.className || ""}`}
			/>
		</FormFieldContainer>
	);
};

// 4. Register the Component
createComponent<TextareaConfig, TextareaProps>({
	type: "textarea",
	schema: TextareaConfigSchema,
	component: Textarea,
	transformProps: (config: TextareaConfig, context: FormEngineContext): TextareaProps => {
		const { id, name, label, description, placeholder, defaultValue, rows, type, ...restConfig } = config;
		const fieldId = id || name; // Ensure an ID for htmlFor and aria-describedby

		const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
			context.onDataChange(name, event.target.value);
		};

		return {
			containerProps: {
				name: name,
				label: label,
				description: description,
				htmlFor: fieldId,
			},
			textareaProps: {
				id: fieldId,
				name: name,
				placeholder: placeholder,
				value: context.formData[name] ?? defaultValue ?? "",
				onChange: handleChange,
				rows: rows || 3, // Default to 3 rows if not specified
				"aria-describedby": description ? `${fieldId}-description` : undefined,
				disabled: context.formMode === "view",
				// required: config.validation?.required,
			},
		};
	},
});
