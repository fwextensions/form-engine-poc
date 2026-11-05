// packages/form-engine/src/components/fields/CheckboxGroup.tsx
// "Select all that apply": a set of checkboxes that collects an array of values.
import React from "react";
import { z } from "zod";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "@radix-ui/react-icons";
import { defineField } from "../../core/defineField";
import { serializeForUI } from "../../utils/valueSerialization";
import { radioOptionsSchema } from "./options";
import { checkboxClassName, optionLabelClassName } from "./styles";

/** Toggles `optionValue` in `selected`, keeping the options' declared order. */
export function toggleSelection(selected: readonly unknown[], optionValue: unknown, order: readonly unknown[]): unknown[] {
	const key = serializeForUI(optionValue);
	const has = selected.some((v) => serializeForUI(v) === key);
	const next = has ? selected.filter((v) => serializeForUI(v) !== key) : [...selected, optionValue];
	const rank = new Map(order.map((v, i) => [serializeForUI(v), i]));
	return [...next].sort((a, b) => (rank.get(serializeForUI(a)) ?? 0) - (rank.get(serializeForUI(b)) ?? 0));
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
	value: { empty: [] },
	control: ({ config, value, setValue, disabled, required, inputProps }) => {
		const selected = Array.isArray(value) ? value : [];
		const selectedKeys = new Set(selected.map(serializeForUI));
		const order = config.options.map((o) => o.value);
		const orientationClass = config.orientation === "horizontal" ? "flex flex-wrap gap-x-6 gap-y-2" : "space-y-2";

		return (
			<div
				role="group"
				aria-labelledby={`${inputProps.id}-label`}
				aria-describedby={inputProps["aria-describedby"]}
				aria-required={required}
				className={`mt-1.5 ${orientationClass}`}
			>
				{/* Participates in native constraint validation so `required` shows the standard message. */}
				<input
					type="checkbox"
					name={inputProps.name}
					required={required}
					checked={selected.length > 0}
					onChange={() => {}}
					tabIndex={-1}
					aria-hidden="true"
					className="sr-only"
				/>
				{config.options.map((option) => {
					const key = serializeForUI(option.value);
					const itemId = `${inputProps.id}-${key}`;
					return (
						<div key={key} className="flex items-center gap-2">
							<CheckboxPrimitive.Root
								id={itemId}
								checked={selectedKeys.has(key)}
								disabled={disabled || option.disabled}
								onCheckedChange={() => setValue(toggleSelection(selected, option.value, order))}
								className={checkboxClassName}
							>
								<CheckboxPrimitive.Indicator>
									<CheckIcon className="h-4 w-4" />
								</CheckboxPrimitive.Indicator>
							</CheckboxPrimitive.Root>
							<label htmlFor={itemId} className={optionLabelClassName}>
								{option.label}
							</label>
						</div>
					);
				})}
			</div>
		);
	},
}).schema;
export type CheckboxGroupConfig = z.infer<typeof CheckboxGroupConfigSchema>;
