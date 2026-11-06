// packages/form-engine/src/components/fields/YesNo.tsx
// A two-option question with a boolean value. Rules can test `is: true` / `is: false`.
import React from "react";
import { z } from "zod";
import { Radio } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";
import { defineField } from "../../core/defineField";
import { optionLabelClassName, radioItemClassName } from "./styles";

export const YesNoConfigSchema = defineField<
	{
		yesLabel: z.ZodDefault<z.ZodOptional<z.ZodString>>;
		noLabel: z.ZodDefault<z.ZodOptional<z.ZodString>>;
		defaultValue: z.ZodOptional<z.ZodBoolean>;
		orientation: z.ZodDefault<z.ZodOptional<z.ZodEnum<{ horizontal: "horizontal"; vertical: "vertical" }>>>;
	},
	boolean | undefined
>({
	type: "yesno",
	description: "A yes/no question rendered as two radio buttons; the value is a boolean (true for yes)",
	example: { id: "worksInSanFrancisco", label: "Do you work in San Francisco?*" },
	notes: "Prefer `yesno` over a two-option `radiogroup` for boolean questions: rules can then use `is: true` or `is: false` without guessing how yes and no were encoded.",
	schema: {
		yesLabel: z.string().optional().default("Yes"),
		noLabel: z.string().optional().default("No"),
		defaultValue: z.boolean().optional(),
		orientation: z.enum(["horizontal", "vertical"]).optional().default("horizontal"),
	},
	value: { empty: undefined, serialize: (v) => (v === true ? "true" : v === false ? "false" : ""), deserialize: (s) => (s === "true" ? true : s === "false" ? false : undefined) },
	messages: { valueMissing: "Please choose yes or no." },
	control: ({ config, value, setValue, disabled, required, inputProps }) => {
		const options = [
			{ label: config.yesLabel ?? "Yes", key: "true", value: true },
			{ label: config.noLabel ?? "No", key: "false", value: false },
		];
		const orientationClass = config.orientation === "horizontal" ? "flex space-x-6" : "space-y-2";

		return (
			<RadioGroupPrimitive
				name={inputProps.name}
				value={value ?? null}
				onValueChange={(v) => setValue(v === true)}
				disabled={disabled}
				required={required}
				aria-labelledby={`${inputProps.id}-label`}
				aria-describedby={inputProps["aria-describedby"]}
				className={`mt-1.5 ${orientationClass}`}
			>
				{options.map((option) => (
					<label key={option.key} className={`flex items-center gap-2 ${optionLabelClassName}`}>
						<Radio.Root value={option.value} className={radioItemClassName}>
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
export type YesNoConfig = z.infer<typeof YesNoConfigSchema>;
