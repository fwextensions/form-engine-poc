// packages/form-engine/src/components/fields/options.ts
// Shared option schemas for choice fields (select, radiogroup).
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
