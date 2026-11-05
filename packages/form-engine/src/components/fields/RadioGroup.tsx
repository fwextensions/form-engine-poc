// packages/form-engine/src/components/fields/RadioGroup.tsx
import React from "react";
import { z } from "zod";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { defineField } from "../../core/defineField";
import { serializeForUI, deserializeFromUI } from "../../utils/valueSerialization";
import { radioOptionsSchema } from "./options";
import { optionLabelClassName } from "./styles";

export const RadioGroupConfigSchema = defineField<
	{
		options: typeof radioOptionsSchema;
		defaultValue: z.ZodOptional<z.ZodAny>;
		orientation: z.ZodDefault<z.ZodOptional<z.ZodEnum<{ horizontal: "horizontal"; vertical: "vertical" }>>>;
	},
	unknown
>({
	type: "radiogroup",
	description: "A group of radio buttons for selecting one option from a short list",
	example: {
		id: "contactMethod",
		label: "Preferred contact method*",
		options: [
			{ label: "Email", value: "email" },
			{ label: "Phone", value: "phone" },
		],
	},
	notes: "Prefer the `{label, value}` object form for options. Plain strings are also accepted and use the string as both label and value. Use `radiogroup` for up to about six options and `select` for longer lists.",
	schema: {
		options: radioOptionsSchema.describe(
			"List of radio options. Each option is either a {label, value} object (the preferred approach) or a plain string (used as both label and value). Example: [{label: 'Yes', value: true}, {label: 'No', value: false}]",
		),
		defaultValue: z.any().optional(),
		orientation: z.enum(["horizontal", "vertical"]).optional().default("vertical"),
	},
	value: { empty: undefined, serialize: serializeForUI, deserialize: deserializeFromUI },
	control: ({ config, value, setValue, disabled, required, inputProps }) => {
		const options = config.options.map((o) => ({
			label: o.label,
			value: serializeForUI(o.value),
			disabled: o.disabled,
		}));
		const uiValue = value !== undefined ? serializeForUI(value) : undefined;
		const orientationClass = config.orientation === "horizontal" ? "flex space-x-4" : "space-y-2";

		return (
			<RadioGroupPrimitive.Root
				name={inputProps.name}
				value={uiValue}
				onValueChange={(v) => setValue(deserializeFromUI(v))}
				disabled={disabled}
				required={required}
				orientation={config.orientation}
				aria-required={required}
				aria-describedby={inputProps["aria-describedby"]}
				className={`mt-1.5 ${orientationClass}`}
			>
				{options.map((option) => {
					const itemId = `${inputProps.id}-${option.value}`;
					return (
						<div key={option.value} className="flex items-center gap-2">
							<RadioGroupPrimitive.Item
								value={option.value}
								id={itemId}
								disabled={option.disabled}
								className="h-4 w-4 rounded-full border border-ink-200 text-primary-600 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed data-[state=checked]:bg-primary-600 data-[state=checked]:border-primary-600"
							>
								<RadioGroupPrimitive.Indicator className="flex items-center justify-center">
									<div className="h-1.5 w-1.5 rounded-full bg-white"></div>
								</RadioGroupPrimitive.Indicator>
							</RadioGroupPrimitive.Item>
							<label htmlFor={itemId} className={optionLabelClassName}>
								{option.label}
							</label>
						</div>
					);
				})}
			</RadioGroupPrimitive.Root>
		);
	},
}).schema;
export type RadioGroupConfig = z.infer<typeof RadioGroupConfigSchema>;
