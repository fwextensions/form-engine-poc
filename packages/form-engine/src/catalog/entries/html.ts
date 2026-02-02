// packages/form-engine/src/catalog/entries/html.ts
import { z } from "zod";
import type { CatalogEntry } from "../catalog";
import { baseComponentConfigSchema } from "../../core/baseSchemas";

/**
 * Schema for html component configuration.
 */
export const htmlConfigSchema = baseComponentConfigSchema.extend({
	type: z.literal("html"),
	content: z.string(),
	tag: z.string().optional(),
	className: z.string().optional(),
	style: z.record(z.string(), z.any()).optional(),
});
export type HtmlConfig = z.infer<typeof htmlConfigSchema>;

/**
 * Catalog entry for the html component.
 */
export const htmlEntry: CatalogEntry = {
	schema: htmlConfigSchema,
	description: "Static HTML content block for rendering custom markup",
};
