// packages/form-engine/src/components/fields/RadioGroup.tsx
import React from "react";
import { z } from "zod";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import {
	baseFieldConfigSchema,
	commonFieldTransform,
} from "../baseSchemas";
import { createComponent, FormEngineContext } from "../../core/componentFactory";
import { FormFieldContainer, FormFieldContainerProps } from "../layout/FormFieldContainer";

// 1. Define Configuration Schema
const radioOptionSchema = z.object({
	label: z.string(),
	value: z.string(),
	disabled: z.boolean().optional(),
});
export type RadioOption = z.infer<typeof radioOptionSchema>;

export const RadioGroupConfigSchema = baseFieldConfigSchema.extend({
	type: z.literal("radiogroup"),
	options: z.array(radioOptionSchema),
	defaultValue: z.string().optional(),
	orientation: z.enum(["horizontal", "vertical"]).optional().default("vertical"),
});
export type RadioGroupConfig = z.infer<typeof RadioGroupConfigSchema>;

// 2. Define Props for the React Component
export interface RadioGroupProps {
	containerProps: Omit<FormFieldContainerProps, "children" | "htmlFor">; // RadioGroup itself doesn't need htmlFor
	radioGroupRootProps: RadioGroupPrimitive.RadioGroupProps & { required?: boolean };
	options: RadioOption[];
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

// 4. Register the Component
createComponent<RadioGroupConfig, RadioGroupProps>({
	type: "radiogroup",
	schema: RadioGroupConfigSchema,
	component: RadioGroup,
	transformConfig: commonFieldTransform,
	transformProps: (config, context) => {
		const { id, label, description, options, defaultValue, validation, orientation } = config;
		return {
			containerProps: {
				name: id,
				label,
				description,
			},
			radioGroupRootProps: {
				name: id, // This name is used for the form data path and for item IDs
				value: context.formData[id] ?? defaultValue ?? undefined,
				onValueChange: (value) => context.onDataChange(id, value),
				disabled: context.formMode === "view",
				required: validation?.required,
				orientation,
			},
			options,
		};
	},
});
