// packages/form-engine/src/catalog/entries/checkbox.ts
import { z } from "zod";
import type { CatalogEntry } from "../catalog";
import { baseFieldConfigSchema, commonFieldTransform } from "../../core/baseSchemas";

/**
 * Schema for checkbox component configuration.
 */
export const checkboxConfigSchema = baseFieldConfigSchema.extend({
	type: z.literal("checkbox"),
	defaultValue: z.boolean().optional(),
});
export type CheckboxConfig = z.infer<typeof checkboxConfigSchema>;

/**
 * Catalog entry for the checkbox component.
 */
export const checkboxEntry: CatalogEntry = {
	schema: checkboxConfigSchema,
	description: "A checkbox input for boolean values",
	transformConfig: commonFieldTransform,
};
