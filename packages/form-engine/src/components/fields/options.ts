// packages/form-engine/src/components/fields/options.ts
// Shared option schemas for choice fields (select, radiogroup).
//
// Authors may write options as `{label, value}` objects or as plain strings.
// The schemas normalise the shorthand during validation, so every consumer of
// a validated config (renderer, exporters, tests) sees `{label, value}` objects.
import { z } from "zod";

export const optionSchema = z.object({
	label: z.string().describe("Display text shown for the option"),
	value: z.any().describe("The value submitted when this option is selected. Can be string, number, or boolean."),
});

export const radioOptionSchema = optionSchema.extend({
	disabled: z.boolean().optional().describe("If true, this option is shown but cannot be selected"),
});

const shorthand = z.string().describe("Shorthand: a plain string is used as both the label and value");

/** Options are either full `{label, value}` objects or plain strings. */
export const optionInputSchema = z.union([optionSchema, shorthand]);
export const radioOptionInputSchema = z.union([radioOptionSchema, shorthand]);

export type Option = z.infer<typeof optionSchema>;
export type RadioOption = z.infer<typeof radioOptionSchema>;

/** Expands string shorthand into `{label, value}` objects. */
export function normalizeOptions<O extends Option>(options: ReadonlyArray<O | string>): O[] {
	return options.map((o) => (typeof o === "string" ? ({ label: o, value: o } as O) : o));
}

/** `options` property for select-like fields; validated output is always normalised. */
export const optionsSchema = z.array(optionInputSchema).transform((options) => normalizeOptions<Option>(options));
export const radioOptionsSchema = z.array(radioOptionInputSchema).transform((options) => normalizeOptions<RadioOption>(options));

/** The label of the option whose value equals `value`, or the value itself as text. */
export function optionLabel(options: ReadonlyArray<{ label: string; value: unknown }> | undefined, value: unknown): string {
	const key = JSON.stringify(value);
	return options?.find((o) => JSON.stringify(o.value) === key)?.label ?? String(value);
}

/** Display text for a single-choice value: null when nothing is chosen. */
export function displayChoice(value: unknown, config: Record<string, any>): string | null {
	if (value === undefined || value === null || value === "") return null;
	return optionLabel(config.options, value);
}
