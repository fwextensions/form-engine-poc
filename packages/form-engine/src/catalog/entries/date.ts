// packages/form-engine/src/catalog/entries/date.ts
import { z } from "zod";
import type { CatalogEntry } from "../catalog";
import { baseFieldConfigSchema, commonFieldTransform } from "../../core/baseSchemas";

/**
 * Schema for date component configuration.
 */
export const dateConfigSchema = baseFieldConfigSchema.extend({
	type: z.literal("date"),
	placeholder: z.string().optional(),
	defaultValue: z.string().optional(), // Should be in 'YYYY-MM-DD' format
	min: z.string().optional(), // Should be in 'YYYY-MM-DD' format
	max: z.string().optional(), // Should be in 'YYYY-MM-DD' format
});
export type DateConfig = z.infer<typeof dateConfigSchema>;

/**
 * Catalog entry for the date component.
 */
export const dateEntry: CatalogEntry = {
	schema: dateConfigSchema,
	description: "A date picker input for selecting dates",
	transformConfig: commonFieldTransform,
};
