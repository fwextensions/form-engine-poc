// packages/form-engine/src/catalog/entries/page.ts
import { z } from "zod";
import type { CatalogEntry } from "../catalog";
import { baseLayoutComponentConfigSchema } from "../../core/baseSchemas";

/**
 * Schema for page component configuration.
 */
export const pageConfigSchema = baseLayoutComponentConfigSchema.extend({
	type: z.literal("page"),
	title: z.string().optional(),
	className: z.string().optional(),
	style: z.record(z.string(), z.any()).optional(),
});
export type PageConfig = z.infer<typeof pageConfigSchema>;

/**
 * Catalog entry for the page component.
 */
export const pageEntry: CatalogEntry = {
	schema: pageConfigSchema,
	hasChildren: true,
	description: "A page container for grouping form fields in multi-page forms",
};
