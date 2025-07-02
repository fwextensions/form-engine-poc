// packages/form-engine/src/components/fields/Checkbox.tsx
import React from "react";
import { z } from "zod";
import { Label, Message } from "@radix-ui/react-form";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "@radix-ui/react-icons";
import {
	baseFieldConfigSchema,
	commonFieldTransform,
} from "../baseSchemas";
import { createComponent } from "../../core/componentFactory";
import { FormFieldContainer, FormFieldContainerProps } from "../layout/FormFieldContainer";

// 1. Define Configuration Schema
// Note: For checkbox, the 'label' from base is often the main descriptive label.
// An additional 'checkboxLabel' can be used for text right next to the checkbox itself.
export const CheckboxConfigSchema = baseFieldConfigSchema.extend({
	type: z.literal("checkbox"),
	defaultValue: z.boolean().optional(),
});
export type CheckboxConfig = z.infer<typeof CheckboxConfigSchema>;

// 2. Define Props for the React Component
export interface CheckboxProps {
	containerProps: Omit<FormFieldContainerProps, "children" | "htmlFor">; // htmlFor is handled internally
	checkboxRootProps: CheckboxPrimitive.CheckboxProps & { id: string; label?: string; required?: boolean };
}

// 3. Create the React Component
export const Checkbox: React.FC<CheckboxProps> = ({ containerProps, checkboxRootProps }) => {
	const { label, id } = checkboxRootProps;

	return (
		<FormFieldContainer {...containerProps} htmlFor={id}>
			<>
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
				{label && (
					<Label htmlFor={id} className="ml-2 text-sm text-gray-700">
						{label}
					</Label>
				)}
			</div>
			{checkboxRootProps?.required && (
				<Message name={id} match={(value) => {
					switch (typeof value) {
						case "boolean":
							return !value; // Show message if boolean value is false
						case "string":
							// Show message if string value (case-insensitive) is not "true"
							return value.toLowerCase() !== "true";
						default:
							// For undefined, null, or other types, consider it "not checked"
							return true;
					}
				}}>
					{label || "This checkbox"} must be checked.
				</Message>
			)}
			</>
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
		const { id, label, description, defaultValue, validation } = config;
		const checked = context.formData[id] ?? defaultValue ?? false;

		return {
			containerProps: {
				name: id,
				description,
			},
			checkboxRootProps: {
				id,
				name: id,
				label,
				checked: checked as boolean, // Radix expects boolean or 'indeterminate'
				onCheckedChange: (isChecked) => context.onDataChange(id, isChecked),
				disabled: context.formMode === "view",
				required: validation?.required,
			},
		};
	},
});
