// packages/form-engine/src/components/fields/Checkbox.tsx
import React from "react";
import { z } from "zod";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "@radix-ui/react-icons";
import {
	baseFieldConfigSchema,
	commonFieldTransform,
} from "../baseSchemas";
import { createComponent, FormEngineContext } from "../../core/componentFactory";
import { FormFieldContainer, FormFieldContainerProps } from "../layout/FormFieldContainer";

// 1. Define Configuration Schema
// Note: For checkbox, the 'label' from base is often the main descriptive label.
// An additional 'checkboxLabel' can be used for text right next to the checkbox itself.
export const CheckboxConfigSchema = baseFieldConfigSchema.extend({
	type: z.literal("checkbox"),
	checkboxLabel: z.string().optional(), // Label specific to the checkbox input itself
	defaultValue: z.boolean().optional(),
	// 'validation.required' for a checkbox usually means it *must* be checked.
});
export type CheckboxConfig = z.infer<typeof CheckboxConfigSchema>;

// 2. Define Props for the React Component
export interface CheckboxProps {
	containerProps: Omit<FormFieldContainerProps, "children" | "htmlFor">; // htmlFor is handled internally
	checkboxRootProps: CheckboxPrimitive.CheckboxProps & { id: string; required?: boolean };
	checkboxLabel?: string;
}

// 3. Create the React Component
export const Checkbox: React.FC<CheckboxProps> = ({ containerProps, checkboxRootProps, checkboxLabel }) => {
	// The main label (containerProps.label) is handled by FormFieldContainer
	// The checkboxLabel is rendered next to the checkbox itself
	return (
		<FormFieldContainer {...containerProps} htmlFor={checkboxRootProps.id}>
			<div className="flex items-center mt-1">
				<CheckboxPrimitive.Root
					{...checkboxRootProps}
					className={`flex h-5 w-5 items-center justify-center rounded border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 data-[state=checked]:bg-indigo-600 data-[state=checked]:text-white disabled:bg-gray-100 disabled:cursor-not-allowed ${checkboxRootProps.className || ""}`}
					aria-required={checkboxRootProps.required}
				>
					<CheckboxPrimitive.Indicator>
						<CheckIcon className="h-4 w-4" />
					</CheckboxPrimitive.Indicator>
				</CheckboxPrimitive.Root>
				{checkboxLabel && (
					<label htmlFor={checkboxRootProps.id} className="ml-2 text-sm text-gray-700">
						{checkboxLabel}
					</label>
				)}
			</div>
		</FormFieldContainer>
	);
};

// 4. Register the Component
createComponent<CheckboxConfig, CheckboxProps>({
	type: "checkbox",
	schema: CheckboxConfigSchema,
	component: Checkbox,
	transformConfig: commonFieldTransform,
	transformProps: (config, context) => {
		const { id, label, description, checkboxLabel, defaultValue, validation } = config;
		const checked = context.formData[id] ?? defaultValue ?? false;

		return {
			containerProps: {
				name: id,
				label, // This is the main field label
				description,
				// No htmlFor here, FormFieldContainer will use the one from CheckboxRootProps.id if provided
			},
			checkboxRootProps: {
				id,
				name: id,
				checked: checked as boolean, // Radix expects boolean or 'indeterminate'
				onCheckedChange: (isChecked) => context.onDataChange(id, isChecked),
				disabled: context.formMode === "view",
				required: validation?.required,
			},
			checkboxLabel, // This is the label next to the checkbox input
		};
	},
});
