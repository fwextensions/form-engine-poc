// packages/form-engine/src/components/fields/DateField.tsx
import React from "react";
import { z } from "zod";
import { baseFieldConfigSchema } from "../baseSchemas";
import { createComponent, FormEngineContext } from "../../core/componentFactory";
import { FormFieldContainer, FormFieldContainerProps } from "../layout/FormFieldContainer";

// 1. Define Configuration Schema
export const DateConfigSchema = baseFieldConfigSchema.extend({
	type: z.literal("date"),
	defaultValue: z.string().optional(), // Expect YYYY-MM-DD format
	// placeholder: z.string().optional(), // Placeholder is not very effective for type="date"
	// validation: z.object({ required: z.boolean().optional() }).optional(),
});
export type DateConfig = z.infer<typeof DateConfigSchema>;

// 2. Define Props for the React Component
export interface DateProps {
	containerProps: Omit<FormFieldContainerProps, "children">;
	inputProps: React.InputHTMLAttributes<HTMLInputElement>;
}

// 3. Create the React Component
// Renamed to DateFieldComponent to avoid potential export name conflicts if file is DateField.tsx
export const DateFieldComponent: React.FC<DateProps> = ({ containerProps, inputProps }) => {
	return (
		<FormFieldContainer {...containerProps}>
			<input
				type="date"
				{...inputProps}
				className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${inputProps.className || ""}`}
			/>
		</FormFieldContainer>
	);
};

// 4. Register the Component
createComponent<DateConfig, DateProps>({
	type: "date",
	schema: DateConfigSchema,
	component: DateFieldComponent,
	transformProps: (config: DateConfig, context: FormEngineContext): DateProps => {
		const { id, name, label, description, defaultValue, type, ...restConfig } = config;
		const fieldId = id || name;

		const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
			context.onDataChange(name, event.target.value);
		};

		// Date input expects value in "yyyy-mm-dd" format.
		const currentValue = context.formData[name] ?? defaultValue ?? "";

		return {
			containerProps: {
				name: name,
				label: label,
				description: description,
				htmlFor: fieldId,
			},
			inputProps: {
				id: fieldId,
				name: name,
				type: "date",
				value: currentValue,
				onChange: handleChange,
				"aria-describedby": description ? `${fieldId}-description` : undefined,
				disabled: context.formMode === "view",
				// required: config.validation?.required,
			},
		};
	},
});

// To allow direct import if needed, though DynamicRenderer is the primary consumer
// export const DateField = DateFieldComponent;
