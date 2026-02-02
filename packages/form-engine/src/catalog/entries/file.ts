// packages/form-engine/src/catalog/entries/file.ts
import { z } from "zod";
import type { CatalogEntry } from "../catalog";
import { baseFieldConfigSchema, commonFieldTransform } from "../../core/baseSchemas";

/**
 * Schema for file component configuration.
 */
export const fileConfigSchema = baseFieldConfigSchema.extend({
	type: z.literal("file"),
	accept: z.string().optional(), // e.g., "image/*,.pdf"
	multiple: z.boolean().optional(),
});
export type FileConfig = z.infer<typeof fileConfigSchema>;

/**
 * Catalog entry for the file component.
 */
export const fileEntry: CatalogEntry = {
	schema: fileConfigSchema,
	description: "A file upload input for selecting files",
	transformConfig: commonFieldTransform,
};
