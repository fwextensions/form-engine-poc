// packages/form-engine/src/catalog/entries/addressValidation.ts
import { z } from "zod";
import type { CatalogEntry } from "../catalog";
import { baseFieldConfigSchema, commonFieldTransform } from "../../core/baseSchemas";

/**
 * Schema for addressValidation component configuration.
 */
export const addressValidationConfigSchema = baseFieldConfigSchema.extend({
	type: z.literal("addressValidation"),
});
export type AddressValidationConfig = z.infer<typeof addressValidationConfigSchema>;

/**
 * Catalog entry for the addressValidation component.
 */
export const addressValidationEntry: CatalogEntry = {
	schema: addressValidationConfigSchema,
	description: "An address input with validation support",
	transformConfig: commonFieldTransform,
};
