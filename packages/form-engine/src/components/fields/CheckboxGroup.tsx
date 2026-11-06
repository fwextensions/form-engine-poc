// packages/form-engine/src/components/fields/CheckboxGroup.tsx
// "Select all that apply": a set of checkboxes that collects an array of values.
import React from "react";
import { z } from "zod";
import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { CheckboxGroup as CheckboxGroupPrimitive } from "@base-ui/react/checkbox-group";
import { defineField } from "../../core/defineField";
import { serializeForUI } from "../../utils/valueSerialization";
import { radioOptionsSchema } from "./options";
import { CheckIcon } from "./icons";
import { checkboxClassName, optionLabelClassName } from "./styles";

/** Toggles `optionValue` in `selected`, keeping the options' declared order. */
export function toggleSelection(selected: readonly unknown[], optionValue: unknown, order: readonly unknown[]): unknown[] {
	const key = serializeForUI(optionValue);
	const has = selected.some((v) => serializeForUI(v) === key);
	const next = has ? selected.filter((v) => serializeForUI(v) !== key) : [...selected, optionValue];
	const rank = new Map(order.map((v, i) => [serializeForUI(v), i]));
	return [...next].sort((a, b) => (rank.get(serializeForUI(a)) ?? 0) - (rank.get(serializeForUI(b)) ?? 0));
}

/** Maps the group's serialized keys back to the raw option values, in option order. */
export function valuesFromKeys(keys: readonly string[], order: readonly unknown[]): unknown[] {
	const wanted = new Set(keys);
	return order.filter((v) => wanted.has(serializeForUI(v)));
}

export const CheckboxGroupConfigSchema = defineField<
	{
		options: typeof radioOptionsSchema;
		defaultValue: z.ZodOptional<z.ZodArray<z.ZodAny>>;
		orientation: z.ZodDefault<z.ZodOptional<z.ZodEnum<{ horizontal: "horizontal"; vertical: "vertical" }>>>;
	},
	unknown[]
>({
	type: "checkboxgroup",
	description: "A group of checkboxes for selecting any number of options from a list (\"select all that apply\"); the value is an array",
	example: {
		id: "housingPriorities",
		label: "Which of these apply to you?",
		options: [
			{ label: "Veteran", value: "veteran" },
			{ label: "Senior (62+)", value: "senior" },
			{ label: "Person with a disability", value: "disability" },
		],
	},
	notes: "Use `checkboxgroup` for \"select all that apply\" questions and `checkbox` for a single yes/no agreement. `validation.required: true` means at least one option must be selected.",
	schema: {
		options: radioOptionsSchema.describe(
			"List of options. Each option is either a {label, value} object or a plain string (used as both label and value).",
		),
		defaultValue: z.array(z.any()).optional().describe("Option values selected initially"),
		orientation: z.enum(["horizontal", "vertical"]).optional().default("vertical"),
	},
	value: {
		empty: [],
		display: (value, config) => {
			if (!Array.isArray(value) || value.length === 0) return null;
			const options = (config.options ?? []) as Array<{ label: string; value: unknown }>;
			return value.map((v) => options.find((o) => serializeForUI(o.value) === serializeForUI(v))?.label ?? String(v)).join(", ");
		},
	},
	// `required` becomes a validate rule on the group's value.
	validate: (value, { required }) => (required && (!Array.isArray(value) || value.length === 0) ? "Select at least one option." : null),
	control: ({ config, value, setValue, disabled, required, inputProps }) => {
		const selected = Array.isArray(value) ? value : [];
		const order = config.options.map((o) => o.value);
		const orientationClass = config.orientation === "horizontal" ? "flex flex-wrap gap-x-6 gap-y-2" : "space-y-2";

		return (
			<CheckboxGroupPrimitive
				aria-labelledby={`${inputProps.id}-label`}
				aria-describedby={inputProps["aria-describedby"]}
				aria-required={required}
				value={selected.map(serializeForUI)}
				onValueChange={(keys) => setValue(valuesFromKeys(keys, order))}
				disabled={disabled}
				className={`mt-1.5 ${orientationClass}`}
			>
				{config.options.map((option) => {
					const key = serializeForUI(option.value);
					return (
						<label key={key} className={`flex items-center gap-2 ${optionLabelClassName}`}>
							<CheckboxPrimitive.Root name={inputProps.name} value={key} disabled={option.disabled} className={checkboxClassName}>
								<CheckboxPrimitive.Indicator>
									<CheckIcon className="h-4 w-4" />
								</CheckboxPrimitive.Indicator>
							</CheckboxPrimitive.Root>
							{option.label}
						</label>
					);
				})}
			</CheckboxGroupPrimitive>
		);
	},
}).schema;
export type CheckboxGroupConfig = z.infer<typeof CheckboxGroupConfigSchema>;
