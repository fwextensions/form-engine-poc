// packages/form-engine/src/catalog/entries/radiogroup.ts
import { z } from "zod";
import type { CatalogEntry } from "../catalog";
import { baseFieldConfigSchema, commonFieldTransform } from "../../core/baseSchemas";

/**
 * Schema for radio option.
 */
export const radioOptionSchema = z.object({
	label: z.string(),
	value: z.string(),
	disabled: z.boolean().optional(),
});
export type RadioOption = z.infer<typeof radioOptionSchema>;

/**
 * Schema for radiogroup component configuration.
 */
export const radiogroupConfigSchema = baseFieldConfigSchema.extend({
	type: z.literal("radiogroup"),
	options: z.array(radioOptionSchema),
	defaultValue: z.string().optional(),
	orientation: z.enum(["horizontal", "vertical"]).optional().default("vertical"),
});
export type RadioGroupConfig = z.infer<typeof radiogroupConfigSchema>;

/**
 * Catalog entry for the radiogroup component.
 */
export const radiogroupEntry: CatalogEntry = {
	schema: radiogroupConfigSchema,
	description: "A group of radio buttons for selecting one option from multiple choices",
	transformConfig: commonFieldTransform,
};
