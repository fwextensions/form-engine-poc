// packages/form-engine/src/components/fields/Select.tsx
import React from "react";
import { z } from "zod";
import * as SelectPrimitive from "@radix-ui/react-select";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons"; // Assuming these are available from previous setup
import { baseFieldConfigSchema } from "../baseSchemas";
import { createComponent, FormEngineContext } from "../../core/componentFactory";
import { FormFieldContainer, FormFieldContainerProps } from "../layout/FormFieldContainer";

// 1. Define Configuration Schema
const optionSchema = z.object({
	value: z.string(),
	label: z.string(),
	disabled: z.boolean().optional(),
});
export type Option = z.infer<typeof optionSchema>;

export const SelectConfigSchema = baseFieldConfigSchema.extend({
	type: z.literal("select"),
	options: z.array(optionSchema),
	placeholder: z.string().optional(),
	defaultValue: z.string().optional(),
	// validation: z.object({ required: z.boolean().optional() }).optional(),
});
export type SelectConfig = z.infer<typeof SelectConfigSchema>;

// 2. Define Props for the React Component
export interface SelectProps {
	containerProps: Omit<FormFieldContainerProps, "children">;
	selectProps: SelectPrimitive.SelectProps & { id?: string; className?: string };
	options: Option[];
	placeholder?: string;
}

// 3. Create the React Component
export const Select: React.FC<SelectProps> = ({ containerProps, selectProps, options, placeholder }) => {
	return (
		<FormFieldContainer {...containerProps}>
			<SelectPrimitive.Root {...selectProps}>
				<SelectPrimitive.Trigger
					id={selectProps.id}
					className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${selectProps.className || ""}`}
					aria-describedby={containerProps.description ? `${selectProps.id}-description` : undefined}
				>
					<SelectPrimitive.Value placeholder={placeholder} />
					<SelectPrimitive.Icon asChild>
						<CaretSortIcon className="h-4 w-4 opacity-50" />
					</SelectPrimitive.Icon>
				</SelectPrimitive.Trigger>
				<SelectPrimitive.Portal>
					<SelectPrimitive.Content
						position="popper"
						className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white text-gray-900 shadow-md animate-in fade-in-80"
						sideOffset={5}
						style={{ width: "var(--radix-select-trigger-width)" }} // Ensure content width matches trigger
					>
						<SelectPrimitive.Viewport className="p-1">
							{options.map((option) => (
								<SelectPrimitive.Item
									key={option.value}
									value={option.value}
									disabled={option.disabled}
									className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
								>
									<SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
									<SelectPrimitive.ItemIndicator asChild>
										<CheckIcon className="absolute left-2 h-4 w-4" />
									</SelectPrimitive.ItemIndicator>
								</SelectPrimitive.Item>
							))}
						</SelectPrimitive.Viewport>
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
	transformProps: (config: SelectConfig, context: FormEngineContext): SelectProps => {
		const { id, label, description, options, placeholder, defaultValue, ...restConfig } = config;
		const fieldId = id; // Use id directly

		const handleValueChange = (value: string) => {
			context.onDataChange(id, value);
		};

		return {
			containerProps: {
				name: id, // Use id instead of name
				label: label,
				description: description,
				htmlFor: fieldId,
			},
			selectProps: {
				id: fieldId,
				name: id, // Use id instead of name
				value: context.formData[id] ?? defaultValue ?? undefined,
				onValueChange: handleValueChange,
				disabled: context.formMode === "view",
				// required: config.validation?.required, // For Radix Form to pick up for native validation message
			},
			options: options,
			placeholder: placeholder,
		};
	},
});
