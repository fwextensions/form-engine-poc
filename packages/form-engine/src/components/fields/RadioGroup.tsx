// packages/form-engine/src/components/fields/RadioGroup.tsx
import React from "react";
import { z } from "zod";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import {
	baseFieldConfigSchema,
	commonFieldTransform,
} from "../../core/baseSchemas";
import { createComponent } from "../../core/componentFactory";
import { FormFieldContainer, FormFieldContainerProps } from "../layout/FormFieldContainer";
import { serializeForUI, deserializeFromUI } from "../../utils/valueSerialization";

// 1. Define Configuration Schema
const radioOptionSchema = z.object({
	label: z.string().describe("Display text shown next to the radio button"),
	value: z.any().describe("The value submitted when this option is selected. Can be string, number, or boolean."),
	disabled: z.boolean().optional().describe("If true, this option is shown but cannot be selected"),
});
export type RadioOption = z.infer<typeof radioOptionSchema>;
type UIRadioOption = { label: string; value: string; disabled?: boolean };

// Options can be either full {label, value} objects or plain strings (where the string is used as both label and value)
const radioOptionInputSchema = z.union([
	radioOptionSchema,
	z.string().describe("Shorthand: a plain string is used as both the label and value"),
]);

export const RadioGroupConfigSchema = baseFieldConfigSchema.extend({
	type: z.literal("radiogroup"),
	options: z.array(radioOptionInputSchema).describe(
		"List of radio options. Each option is either a {label, value} object (the preferred approach) or a plain string (used as both label and value). Example: [{label: 'Yes', value: true}, {label: 'No', value: false}]"
	),
	defaultValue: z.any().optional(),
	orientation: z.enum(["horizontal", "vertical"]).optional().default("vertical"),
});
export type RadioGroupConfig = z.infer<typeof RadioGroupConfigSchema>;
// 2. Define Props for the React Component
export interface RadioGroupProps {
	containerProps: Omit<FormFieldContainerProps, "children" | "htmlFor">;
	radioGroupRootProps: RadioGroupPrimitive.RadioGroupProps & { required?: boolean; name?: string };
	options: UIRadioOption[];
}

// 3. Create the React Component
export const RadioGroup: React.FC<RadioGroupProps> = ({ containerProps, radioGroupRootProps, options }) => {
	const orientationClass = radioGroupRootProps.orientation === "horizontal" ? "flex space-x-4" : "space-y-2";
	return (
		<FormFieldContainer {...containerProps}>
			<RadioGroupPrimitive.Root
				{...radioGroupRootProps}
				className={`mt-1 ${orientationClass} ${radioGroupRootProps.className || ""}`}
				aria-required={radioGroupRootProps.required}
				// Radix RadioGroup uses the 'name' prop on items for grouping, but Form.Field uses 'name' for data path.
				// The 'name' on RadioGroupPrimitive.Root is for form submission if not using Radix Form.
			>
				{options.map((option) => (
					<div key={option.value} className="flex items-center">
						<RadioGroupPrimitive.Item
							value={option.value}
							id={`${radioGroupRootProps.name}-${option.value}`} // Unique ID for each radio item
							disabled={option.disabled}
							className="h-4 w-4 rounded-full border border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed data-[state=checked]:bg-indigo-600"
						>
							<RadioGroupPrimitive.Indicator className="flex items-center justify-center">
								<div className="h-1.5 w-1.5 rounded-full bg-white"></div>
							</RadioGroupPrimitive.Indicator>
						</RadioGroupPrimitive.Item>
						<label
							htmlFor={`${radioGroupRootProps.name}-${option.value}`}
							className="ml-2 block text-sm text-gray-700"
						>
							{option.label}
						</label>
					</div>
				))}
			</RadioGroupPrimitive.Root>
		</FormFieldContainer>
	);
};

// 4. Register the Component (schema is colocated, auto-registered to catalog)
createComponent<RadioGroupConfig, RadioGroupProps>({
	type: "radiogroup",
	schema: RadioGroupConfigSchema,
	component: RadioGroup,
	description: `A group of radio buttons for selecting one option from a list.

Options format — prefer the full object form:
  options:
    - label: "Public (VS 117)"
      value: PUBLIC
    - label: "Non-Clergy (VS 115)"
      value: NON_CLERGY

Plain strings are also accepted and will use the string as both label and value:
  options:
    - PUBLIC (VS 117)
    - NON-CLERGY (VS 115)`,
	transformConfig: commonFieldTransform,
	transformProps: (config, context) => {
		const { id, label, description, options, defaultValue, validation, orientation, disabled } = config;

		// Normalize string shorthand to full {label, value} objects
		const normalizedOptions = options.map((o) =>
			typeof o === "string" ? { label: o, value: o } : o
		);

		const uiOptions: UIRadioOption[] = normalizedOptions.map((o) => ({ label: o.label, value: serializeForUI(o.value), disabled: o.disabled }));
		const rawValue = context.formData[id] ?? defaultValue ?? undefined;
		const value = rawValue !== undefined ? serializeForUI(rawValue) : undefined;

		return {
			containerProps: {
				name: id,
				label,
				description,
			},
			radioGroupRootProps: {
				name: id,
				value,
				onValueChange: (v) => context.onDataChange(id, deserializeFromUI(v)),
				disabled: context.formMode === "view" || disabled,
				required: validation?.required,
				orientation,
			},
			options: uiOptions,
		};
	},
});
