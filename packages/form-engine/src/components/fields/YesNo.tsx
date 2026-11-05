// packages/form-engine/src/components/fields/YesNo.tsx
// A two-option question with a boolean value. Rules can test `is: true` / `is: false`.
import React from "react";
import { z } from "zod";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
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
	control: ({ config, value, setValue, disabled, required, inputProps }) => {
		const options = [
			{ label: config.yesLabel ?? "Yes", key: "true", value: true },
			{ label: config.noLabel ?? "No", key: "false", value: false },
		];
		const uiValue = value === true ? "true" : value === false ? "false" : undefined;
		const orientationClass = config.orientation === "horizontal" ? "flex space-x-6" : "space-y-2";

		return (
			<RadioGroupPrimitive.Root
				name={inputProps.name}
				value={uiValue}
				onValueChange={(v) => setValue(v === "true")}
				disabled={disabled}
				required={required}
				orientation={config.orientation}
				aria-required={required}
				aria-describedby={inputProps["aria-describedby"]}
				className={`mt-1.5 ${orientationClass}`}
			>
				{options.map((option) => {
					const itemId = `${inputProps.id}-${option.key}`;
					return (
						<div key={option.key} className="flex items-center gap-2">
							<RadioGroupPrimitive.Item value={option.key} id={itemId} className={radioItemClassName}>
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
export type YesNoConfig = z.infer<typeof YesNoConfigSchema>;
