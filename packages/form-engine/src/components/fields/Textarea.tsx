// packages/form-engine/src/components/fields/Textarea.tsx
import React from "react";
import { z } from "zod";
import { Control } from "@radix-ui/react-form";
import {
	baseFieldConfigSchema,
	commonFieldTransform,
} from "../baseSchemas";
import { createComponent } from "../../core/componentFactory";
import { FormFieldContainer, FormFieldContainerProps } from "../layout/FormFieldContainer";

// 1. Define Configuration Schema
export const TextareaConfigSchema = baseFieldConfigSchema.extend({
	type: z.literal("textarea"),
	placeholder: z.string().optional(),
	defaultValue: z.string().optional(),
	rows: z.number().optional(),
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
			<Control asChild>
				<textarea
					{...textareaProps}
					className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${textareaProps.className || ""}`}
				/>
			</Control>
		</FormFieldContainer>
	);
};

// 4. Register the Component
createComponent<TextareaConfig, TextareaProps>({
	type: "textarea",
	schema: TextareaConfigSchema,
	component: Textarea,
	transformConfig: commonFieldTransform,
	transformProps: (config, context) => {
		const { id, label, description, placeholder, defaultValue, validation, rows, disabled } = config;
		const value = context.formData[id] ?? defaultValue ?? "";

		return {
			containerProps: { name: id, label, description, htmlFor: id },
			textareaProps: {
				id,
				name: id,
				placeholder,
				value,
				onChange: (e) => context.onDataChange(id, e.target.value),
				disabled: context.formMode === "view" || disabled,
				required: validation?.required,
				rows,
			},
		};
	},
});
