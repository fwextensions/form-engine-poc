// packages/form-engine/src/components/fields/Checkbox.tsx
import React from "react";
import { z } from "zod";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "@radix-ui/react-icons";
import { baseFieldConfigSchema } from "../baseSchemas";
import { createComponent, FormEngineContext } from "../../core/componentFactory";
import { FormFieldContainer, FormFieldContainerProps } from "../layout/FormFieldContainer";

// 1. Define Configuration Schema
export const CheckboxConfigSchema = baseFieldConfigSchema.extend({
	type: z.literal("checkbox"),
	// The 'label' from baseFieldConfigSchema can be used as the main label for the FormFieldContainer.
	// This 'checkboxLabel' is for the text immediately next to the checkbox input itself.
	checkboxLabel: z.string().optional(),
	defaultValue: z.boolean().optional(),
	// validation: z.object({ required: z.boolean().optional() }).optional(), // For 'must be checked'
});
export type CheckboxConfig = z.infer<typeof CheckboxConfigSchema>;

// 2. Define Props for the React Component
export interface CheckboxProps {
	containerProps: Omit<FormFieldContainerProps, "children">;
	checkboxProps: CheckboxPrimitive.CheckboxProps & { id?: string };
	checkboxLabel?: string;
}

// 3. Create the React Component
export const Checkbox: React.FC<CheckboxProps> = ({ containerProps, checkboxProps, checkboxLabel }) => {
	return (
		<FormFieldContainer {...containerProps}>
			<div className="flex items-center space-x-2 mt-1">
				<CheckboxPrimitive.Root
					{...checkboxProps}
					className={`peer h-4 w-4 shrink-0 rounded-sm border border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-indigo-600 data-[state=checked]:text-white ${checkboxProps.className || ""}`}
				>
					<CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
						<CheckIcon className="h-4 w-4" />
					</CheckboxPrimitive.Indicator>
				</CheckboxPrimitive.Root>
				{checkboxLabel && (
					<label
						htmlFor={checkboxProps.id}
						className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
					>
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
	transformProps: (config: CheckboxConfig, context: FormEngineContext): CheckboxProps => {
		const { id, label, description, checkboxLabel, defaultValue, ...restConfig } = config;
		const fieldId = id; // Use id directly

		const handleCheckedChange = (checked: CheckboxPrimitive.CheckedState) => {
			context.onDataChange(id, checked === true);
		};

		return {
			containerProps: {
				name: id, // Use id instead of name
				label: label, // This is the main field label
				description: description,
				htmlFor: fieldId, // Associates FormFieldContainer's label with the checkbox
			},
			checkboxProps: {
				id: fieldId,
				name: id, // Radix Checkbox can also take a name. Use id.
				checked: context.formData[id] ?? defaultValue ?? false,
				onCheckedChange: handleCheckedChange,
				disabled: context.formMode === "view",
				// required: config.validation?.required, // If checkbox must be checked
			},
			checkboxLabel: checkboxLabel, // This is the label next to the checkbox itself
		};
	},
});
