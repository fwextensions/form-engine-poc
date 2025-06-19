// packages/form-engine/src/components/fields/Select.tsx
import React from "react";
import { z } from "zod";
import * as SelectPrimitive from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";
import {
	baseFieldConfigSchema,
	commonFieldTransform,
} from "../baseSchemas";
import { createComponent } from "../../core/componentFactory";
import { FormFieldContainer, FormFieldContainerProps } from "../layout/FormFieldContainer";

// 1. Define Configuration Schema
const optionSchema = z.object({
	label: z.string(),
	value: z.string(),
});
export type Option = z.infer<typeof optionSchema>;

export const SelectConfigSchema = baseFieldConfigSchema.extend({
	type: z.literal("select"),
	options: z.array(optionSchema),
	placeholder: z.string().optional(),
	defaultValue: z.string().optional(),
});
export type SelectConfig = z.infer<typeof SelectConfigSchema>;

// 2. Define Props for the React Component
export interface SelectProps {
	containerProps: Omit<FormFieldContainerProps, "children">;
	selectRootProps: SelectPrimitive.SelectProps & { id?: string; required?: boolean; disabled?: boolean };
	options: Option[];
	placeholder?: string;
}

// 3. Create the React Component
export const Select: React.FC<SelectProps> = ({
	containerProps,
	selectRootProps,
	options,
	placeholder,
}) => {
	return (
		<FormFieldContainer {...containerProps}>
			<SelectPrimitive.Root {...selectRootProps}>
				<SelectPrimitive.Trigger
					id={selectRootProps.id} // Ensure id is on the trigger for label association
					className="mt-1 inline-flex items-center justify-between rounded-md px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 shadow-sm hover:bg-gray-50 focus:outline-none focus:border-indigo-500 w-full disabled:bg-gray-100 disabled:cursor-not-allowed"
					aria-required={selectRootProps.required}
					disabled={selectRootProps.disabled}
				>
					<SelectPrimitive.Value placeholder={placeholder} />
					<SelectPrimitive.Icon className="ml-2">
						<ChevronDownIcon />
					</SelectPrimitive.Icon>
				</SelectPrimitive.Trigger>
				<SelectPrimitive.Portal>
					<SelectPrimitive.Content
						position="popper"
						sideOffset={5}
						className="w-[var(--radix-select-trigger-width)] overflow-hidden bg-white rounded-md shadow-lg ring-1 ring-gray-300 z-50"
						onKeyDown={(event: React.KeyboardEvent) => {
							if (event.key === 'Enter') {
								// Prevent Enter from submitting the form when selecting an item
								event.preventDefault();
							}
						}}
					>
						<SelectPrimitive.ScrollUpButton className="flex items-center justify-center h-6 bg-white text-gray-700 cursor-default">
							<ChevronUpIcon />
						</SelectPrimitive.ScrollUpButton>
						<SelectPrimitive.Viewport className="p-1">
							{options.map((option) => (
								<SelectPrimitive.Item
									key={option.value}
									value={option.value}
									className="relative flex items-center px-8 py-2 rounded-sm text-sm text-gray-900 select-none hover:bg-indigo-500 hover:text-white focus:bg-indigo-500 focus:text-white"
								>
									<SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
									<SelectPrimitive.ItemIndicator className="absolute left-2 inline-flex items-center">
										<CheckIcon />
									</SelectPrimitive.ItemIndicator>
								</SelectPrimitive.Item>
							))}
						</SelectPrimitive.Viewport>
						<SelectPrimitive.ScrollDownButton className="flex items-center justify-center h-6 bg-white text-gray-700 cursor-default">
							<ChevronDownIcon />
						</SelectPrimitive.ScrollDownButton>
					</SelectPrimitive.Content>
				</SelectPrimitive.Portal>
			</SelectPrimitive.Root>
		</FormFieldContainer>
	);
};

// 4. Register the Component
createComponent<SelectConfig, SelectProps>({
	type: "select",
	schema: SelectConfigSchema,
	component: Select,
	transformConfig: commonFieldTransform,
	transformProps: (config, context) => {
		const { id, label, description, options, placeholder, defaultValue, validation, disabled } = config;
		const value = context.formData[id] ?? "";

		return {
			containerProps: { name: id, label, description, htmlFor: id },
			selectRootProps: {
				id, // Pass id for label association with trigger
				name: id,
				value,
				onValueChange: (value) => context.onDataChange(id, value),
				disabled: context.formMode === "view" || disabled,
				required: validation?.required,
			},
			options,
			placeholder,
		};
	},
});
