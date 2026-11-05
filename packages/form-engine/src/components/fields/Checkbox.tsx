// packages/form-engine/src/components/fields/Checkbox.tsx
import React from "react";
import { z } from "zod";
import { Label, Message } from "@radix-ui/react-form";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "@radix-ui/react-icons";
import { defineField } from "../../core/defineField";
import { checkboxClassName, optionLabelClassName } from "./styles";


export const CheckboxConfigSchema = defineField<{ defaultValue: z.ZodOptional<z.ZodBoolean> }, boolean>({
	type: "checkbox",
	description: "A checkbox input for boolean values",
	example: { id: "agreeToTerms", label: "I agree to the terms*" },
	schema: {
		defaultValue: z.boolean().optional(),
	},
	value: { empty: false },
	// The label sits beside the box, so the control renders it.
	labelPlacement: "control",
	control: ({ config, value, setValue, required, inputProps }) => (
		<>
			<div className="flex items-center gap-2 mt-1.5">
				<CheckboxPrimitive.Root
					{...inputProps}
					checked={value === true}
					onCheckedChange={(checked) => setValue(checked === true)}
					className={checkboxClassName}
					aria-required={required}
				>
					<CheckboxPrimitive.Indicator>
						<CheckIcon className="h-4 w-4" />
					</CheckboxPrimitive.Indicator>
				</CheckboxPrimitive.Root>
				{config.label && (
					<Label htmlFor={inputProps.id} className={optionLabelClassName}>
						{config.label}
					</Label>
				)}
			</div>
			{required && (
				<Message
					name={inputProps.id}
					match={(v) => {
						switch (typeof v) {
							case "boolean":
								return !v;
							case "string":
								return v.toLowerCase() !== "true";
							default:
								return true; // undefined, null, etc. count as unchecked
						}
					}}
				>
					{config.label || "This checkbox"} must be checked.
				</Message>
			)}
		</>
	),
}).schema;
export type CheckboxConfig = z.infer<typeof CheckboxConfigSchema>;
