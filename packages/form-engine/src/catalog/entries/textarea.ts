// packages/form-engine/src/catalog/entries/textarea.ts
import { z } from "zod";
import type { CatalogEntry } from "../catalog";
import { baseFieldConfigSchema, commonFieldTransform } from "../../core/baseSchemas";

/**
 * Schema for textarea component configuration.
 */
export const textareaConfigSchema = baseFieldConfigSchema.extend({
	type: z.literal("textarea"),
	placeholder: z.string().optional(),
	defaultValue: z.string().optional(),
	rows: z.number().optional(),
});
export type TextareaConfig = z.infer<typeof textareaConfigSchema>;

/**
 * Catalog entry for the textarea component.
 */
export const textareaEntry: CatalogEntry = {
	schema: textareaConfigSchema,
	description: "A multi-line text input area",
	transformConfig: commonFieldTransform,
};
