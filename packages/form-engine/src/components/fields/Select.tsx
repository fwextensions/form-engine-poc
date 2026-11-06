// packages/form-engine/src/components/fields/Select.tsx
import React from "react";
import { z } from "zod";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { defineField } from "../../core/defineField";
import { serializeForUI } from "../../utils/valueSerialization";
import { optionsSchema } from "./options";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "./icons";

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
	value: { empty: undefined },
	messages: { valueMissing: "Please select an option." },
	control: ({ config, value, setValue, disabled, required, inputProps }) => {
		const items = config.options.map((o) => ({ value: o.value, label: o.label }));
		const labelFor = (v: unknown) => items.find((i) => serializeForUI(i.value) === serializeForUI(v))?.label;

		return (
			<SelectPrimitive.Root
				name={inputProps.name}
				items={items}
				value={value === undefined ? null : value}
				onValueChange={(v) => setValue(v ?? undefined)}
				disabled={disabled}
				required={required}
			>
				<SelectPrimitive.Trigger
					id={inputProps.id}
					aria-describedby={inputProps["aria-describedby"]}
					className="mt-1.5 inline-flex items-center justify-between rounded px-3 py-2 text-sm text-gray-900 bg-white border border-ink-100 shadow-sm hover:bg-gray-50 focus:outline-none focus:border-primary-500 w-full data-[disabled]:bg-gray-100 data-[disabled]:cursor-not-allowed data-[placeholder]:text-gray-500"
				>
					<SelectPrimitive.Value>
						{(v: unknown) => (v === null || v === undefined ? (config.placeholder ?? "") : labelFor(v) ?? String(v))}
					</SelectPrimitive.Value>
					<SelectPrimitive.Icon className="ml-2">
						<ChevronDownIcon />
					</SelectPrimitive.Icon>
				</SelectPrimitive.Trigger>
				<SelectPrimitive.Portal>
					<SelectPrimitive.Positioner sideOffset={5} alignItemWithTrigger={false} className="z-50 outline-none">
						<SelectPrimitive.Popup className="w-[var(--anchor-width)] overflow-hidden bg-white rounded-md shadow-lg ring-1 ring-gray-300">
							<SelectPrimitive.ScrollUpArrow className="flex items-center justify-center h-6 bg-white text-gray-700 cursor-default">
								<ChevronUpIcon />
							</SelectPrimitive.ScrollUpArrow>
							<SelectPrimitive.List className="p-1 max-h-72 overflow-y-auto">
								{items.map((item) => (
									<SelectPrimitive.Item
										key={serializeForUI(item.value)}
										value={item.value}
										label={item.label}
										className="relative flex items-center px-8 py-2 rounded-sm text-sm text-gray-900 select-none cursor-default data-[highlighted]:bg-primary-500 data-[highlighted]:text-white"
									>
										<SelectPrimitive.ItemIndicator className="absolute left-2 inline-flex items-center">
											<CheckIcon />
										</SelectPrimitive.ItemIndicator>
										<SelectPrimitive.ItemText>{item.label}</SelectPrimitive.ItemText>
									</SelectPrimitive.Item>
								))}
							</SelectPrimitive.List>
							<SelectPrimitive.ScrollDownArrow className="flex items-center justify-center h-6 bg-white text-gray-700 cursor-default">
								<ChevronDownIcon />
							</SelectPrimitive.ScrollDownArrow>
						</SelectPrimitive.Popup>
					</SelectPrimitive.Positioner>
				</SelectPrimitive.Portal>
			</SelectPrimitive.Root>
		);
	},
}).schema;
export type SelectConfig = z.infer<typeof SelectConfigSchema>;
