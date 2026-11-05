// packages/form-engine/src/components/fields/Select.tsx
import React from "react";
import { z } from "zod";
import * as SelectPrimitive from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";
import { defineField } from "../../core/defineField";
import { serializeForUI, deserializeFromUI } from "../../utils/valueSerialization";
import { optionsSchema } from "./options";

export const SelectConfigSchema = defineField<
	{
		options: typeof optionsSchema;
		placeholder: z.ZodOptional<z.ZodString>;
		defaultValue: z.ZodOptional<z.ZodAny>;
	},
	unknown
>({
	type: "select",
	description: "A dropdown select field for choosing one of several predefined options",
	example: {
		id: "state",
		label: "State*",
		placeholder: "Select a state",
		options: [
			{ label: "California", value: "CA" },
			{ label: "Nevada", value: "NV" },
		],
	},
	notes: "Prefer the `{label, value}` object form for options. Plain strings are also accepted and use the string as both label and value.",
	schema: {
		options: optionsSchema.describe(
			"List of dropdown options. Each option is either a {label, value} object or a plain string. Example: [{label: 'California', value: 'CA'}, {label: 'Nevada', value: 'NV'}] or ['Option A', 'Option B']",
		),
		placeholder: z.string().optional(),
		defaultValue: z.any().optional(),
	},
	value: { empty: undefined, serialize: serializeForUI, deserialize: deserializeFromUI },
	control: ({ config, value, setValue, disabled, required, inputProps }) => {
		const options = config.options.map((o) => ({ label: o.label, value: serializeForUI(o.value) }));
		const uiValue = value !== undefined ? serializeForUI(value) : undefined;

		return (
			<SelectPrimitive.Root
				name={inputProps.name}
				value={uiValue}
				onValueChange={(v) => setValue(deserializeFromUI(v))}
				disabled={disabled}
				required={required}
			>
				<SelectPrimitive.Trigger
					id={inputProps.id} // id on the trigger for label association
					aria-describedby={inputProps["aria-describedby"]}
					aria-required={required}
					disabled={disabled}
					className="mt-1.5 inline-flex items-center justify-between rounded px-3 py-2 text-sm text-gray-900 bg-white border border-ink-100 shadow-sm hover:bg-gray-50 focus:outline-none focus:border-primary-500 w-full disabled:bg-gray-100 disabled:cursor-not-allowed"
				>
					<SelectPrimitive.Value placeholder={config.placeholder} />
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
							if (event.key === "Enter") {
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
									className="relative flex items-center px-8 py-2 rounded-sm text-sm text-gray-900 select-none hover:bg-primary-500 hover:text-white focus:bg-primary-500 focus:text-white"
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
		);
	},
}).schema;
export type SelectConfig = z.infer<typeof SelectConfigSchema>;
