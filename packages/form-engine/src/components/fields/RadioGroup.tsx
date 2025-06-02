// packages/form-engine/src/components/fields/RadioGroup.tsx
import React from "react";
import { z } from "zod";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { baseFieldConfigSchema } from "../baseSchemas";
import { createComponent, FormEngineContext } from "../../core/componentFactory";
import { FormFieldContainer, FormFieldContainerProps } from "../layout/FormFieldContainer";

// 1. Define Configuration Schema
const radioOptionSchema = z.object({
	value: z.string(),
	label: z.string(),
	disabled: z.boolean().optional(),
});
export type RadioOption = z.infer<typeof radioOptionSchema>;

export const RadioGroupConfigSchema = baseFieldConfigSchema.extend({
	type: z.literal("radiogroup"),
	options: z.array(radioOptionSchema),
	defaultValue: z.string().optional(),
	orientation: z.enum(["horizontal", "vertical"]).optional().default("vertical"),
	// validation: z.object({ required: z.boolean().optional() }).optional(),
});
export type RadioGroupConfig = z.infer<typeof RadioGroupConfigSchema>;

// 2. Define Props for the React Component
export interface RadioGroupProps {
	containerProps: Omit<FormFieldContainerProps, "children">;
	radioGroupProps: RadioGroupPrimitive.RadioGroupProps & { id?: string };
	options: RadioOption[];
}

// 3. Create the React Component
export const RadioGroup: React.FC<RadioGroupProps> = ({ containerProps, radioGroupProps, options }) => {
	return (
		<FormFieldContainer {...containerProps}>
			<RadioGroupPrimitive.Root
				{...radioGroupProps}
				className={`mt-1 ${radioGroupProps.orientation === "horizontal" ? "flex space-x-4" : "space-y-2"} ${radioGroupProps.className || ""}`}
			>
				{options.map((option) => (
					<div key={option.value} className="flex items-center space-x-2">
						<RadioGroupPrimitive.Item
							value={option.value}
							id={`${radioGroupProps.id}-${option.value}`}
							disabled={option.disabled}
							className="aspect-square h-4 w-4 rounded-full border border-gray-300 text-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						>
							<RadioGroupPrimitive.Indicator className="flex items-center justify-center">
								<div className="h-2.5 w-2.5 rounded-full bg-current" />
							</RadioGroupPrimitive.Indicator>
						</RadioGroupPrimitive.Item>
						<label
							htmlFor={`${radioGroupProps.id}-${option.value}`}
							className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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
	transformProps: (config: RadioGroupConfig, context: FormEngineContext): RadioGroupProps => {
		const { id, name, label, description, options, defaultValue, orientation, ...restConfig } = config;
		const fieldId = id || name;

		const handleValueChange = (value: string) => {
			context.onDataChange(name, value);
		};

		return {
			containerProps: {
				name: name,
				label: label,
				description: description,
				htmlFor: fieldId, // Associates FormFieldContainer's label with the group
			},
			radioGroupProps: {
				id: fieldId,
				name: name,
				value: context.formData[name] ?? defaultValue ?? undefined,
				onValueChange: handleValueChange,
				disabled: context.formMode === "view",
				orientation: orientation,
				// required: config.validation?.required,
			},
			options: options,
		};
	},
});
