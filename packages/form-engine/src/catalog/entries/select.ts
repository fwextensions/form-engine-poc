// packages/form-engine/src/catalog/entries/select.ts
import { z } from "zod";
import type { CatalogEntry } from "../catalog";
import { baseFieldConfigSchema, commonFieldTransform } from "../../core/baseSchemas";

/**
 * Schema for select option.
 */
export const selectOptionSchema = z.object({
	label: z.string(),
	value: z.string(),
});
export type SelectOption = z.infer<typeof selectOptionSchema>;

/**
 * Schema for select component configuration.
 */
export const selectConfigSchema = baseFieldConfigSchema.extend({
	type: z.literal("select"),
	options: z.array(selectOptionSchema),
	placeholder: z.string().optional(),
	defaultValue: z.string().optional(),
});
export type SelectConfig = z.infer<typeof selectConfigSchema>;

/**
 * Catalog entry for the select component.
 */
export const selectEntry: CatalogEntry = {
	schema: selectConfigSchema,
	description: "A dropdown select input for choosing from a list of options",
	transformConfig: commonFieldTransform,
};
