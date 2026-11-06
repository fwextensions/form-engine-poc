// packages/form-engine/src/components/fields/RadioGroup.tsx
import React from "react";
import { z } from "zod";
import { Radio } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";
import { defineField } from "../../core/defineField";
import { serializeForUI } from "../../utils/valueSerialization";
import { displayChoice, radioOptionsSchema } from "./options";
import { optionLabelClassName, radioItemClassName } from "./styles";

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
	value: { empty: undefined, display: displayChoice },
	messages: { valueMissing: "Please select an option." },
	control: ({ config, value, setValue, disabled, required, inputProps }) => {
		const orientationClass = config.orientation === "horizontal" ? "flex space-x-4" : "space-y-2";

		return (
			<RadioGroupPrimitive
				name={inputProps.name}
				value={value ?? null}
				onValueChange={(v) => setValue(v)}
				disabled={disabled}
				required={required}
				aria-labelledby={`${inputProps.id}-label`}
				aria-describedby={inputProps["aria-describedby"]}
				className={`mt-1.5 ${orientationClass}`}
			>
				{config.options.map((option) => (
					<label key={serializeForUI(option.value)} className={`flex items-center gap-2 ${optionLabelClassName}`}>
						<Radio.Root value={option.value} disabled={option.disabled} className={radioItemClassName}>
							<Radio.Indicator className="flex items-center justify-center">
								<div className="h-1.5 w-1.5 rounded-full bg-white"></div>
							</Radio.Indicator>
						</Radio.Root>
						{option.label}
					</label>
				))}
			</RadioGroupPrimitive>
		);
	},
}).schema;
export type RadioGroupConfig = z.infer<typeof RadioGroupConfigSchema>;
