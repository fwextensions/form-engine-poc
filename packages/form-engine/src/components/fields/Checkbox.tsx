// packages/form-engine/src/components/fields/Checkbox.tsx
import React from "react";
import { z } from "zod";
import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { defineField } from "../../core/defineField";
import { CheckIcon } from "./icons";
import { checkboxClassName, optionLabelClassName } from "./styles";

export const CheckboxConfigSchema = defineField<{ defaultValue: z.ZodOptional<z.ZodBoolean> }, boolean>({
	type: "checkbox",
	description: "A checkbox input for boolean values",
	example: { id: "agreeToTerms", label: "I agree to the terms*" },
	schema: {
		defaultValue: z.boolean().optional(),
	},
	value: { empty: false, display: (v) => (v === true ? "Yes" : "No") },
	// The label sits beside the box, so the control renders it.
	labelPlacement: "control",
	messages: { valueMissing: "This box must be checked." },
	control: ({ config, value, setValue, disabled, required, inputProps }) => (
		<label className={`flex items-center gap-2 mt-1.5 ${optionLabelClassName}`}>
			<CheckboxPrimitive.Root
				id={inputProps.id}
				name={inputProps.name}
				required={required}
				disabled={disabled}
				checked={value === true}
				onCheckedChange={(checked) => setValue(checked === true)}
				aria-describedby={inputProps["aria-describedby"]}
				className={checkboxClassName}
			>
				<CheckboxPrimitive.Indicator>
					<CheckIcon className="h-4 w-4" />
				</CheckboxPrimitive.Indicator>
			</CheckboxPrimitive.Root>
			{config.label}
		</label>
	),
}).schema;
export type CheckboxConfig = z.infer<typeof CheckboxConfigSchema>;
