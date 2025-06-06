// packages/form-engine/src/components/fields/DatePicker.tsx
import React from "react";
import { z } from "zod";
import {
	baseFieldConfigSchema,
	commonFieldTransform,
} from "../baseSchemas";
import { createComponent, FormEngineContext } from "../../core/componentFactory";
import { FormFieldContainer, FormFieldContainerProps } from "../layout/FormFieldContainer";

// 1. Define Configuration Schema
export const DatePickerConfigSchema = baseFieldConfigSchema.extend({
	type: z.literal("date"),
	placeholder: z.string().optional(), // HTML date input doesn't really use placeholder
	defaultValue: z.string().optional(), // Should be in 'YYYY-MM-DD' format
	min: z.string().optional(), // Should be in 'YYYY-MM-DD' format
	max: z.string().optional(), // Should be in 'YYYY-MM-DD' format
});
export type DatePickerConfig = z.infer<typeof DatePickerConfigSchema>;

// 2. Define Props for the React Component
export interface DatePickerProps {
	containerProps: Omit<FormFieldContainerProps, "children">;
	inputProps: React.InputHTMLAttributes<HTMLInputElement>;
}

// 3. Create the React Component
export const DatePicker: React.FC<DatePickerProps> = ({ containerProps, inputProps }) => {
	return (
		<FormFieldContainer {...containerProps}>
			<input
				{...inputProps}
				type="date"
				className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${inputProps.className || ""}`}
				required={inputProps.required} // Added required prop
			/>
		</FormFieldContainer>
	);
};

// 4. Register the Component
createComponent<DatePickerConfig, DatePickerProps>({
	type: "date",
	schema: DatePickerConfigSchema,
	component: DatePicker,
	transformConfig: commonFieldTransform,
	transformProps: (config, context) => {
		const { id, label, description, placeholder, defaultValue, validation, min, max } = config;
		return {
			containerProps: { name: id, label, description, htmlFor: id },
			inputProps: {
				id,
				name: id,
				placeholder, // Though date input doesn't show it, can be useful for other props
				value: context.formData[id] ?? defaultValue ?? "", // Expects YYYY-MM-DD
				onChange: (e) => context.onDataChange(id, e.target.value),
				disabled: context.formMode === "view",
				required: validation?.required,
				min,
				max,
			},
		};
	},
});
