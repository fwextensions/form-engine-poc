// packages/form-engine/src/catalog/entries/text.ts
import { z } from "zod";
import type { CatalogEntry } from "../catalog";
import { baseFieldConfigSchema, commonFieldTransform } from "../../core/baseSchemas";

/**
 * Schema for text component configuration.
 */
export const textConfigSchema = baseFieldConfigSchema.extend({
	type: z.literal("text"),
	placeholder: z.string().optional(),
	defaultValue: z.string().optional(),
	inputType: z.enum(["text", "email", "password", "tel", "url", "number", "date", "datetime-local", "month", "week", "time"]).optional().default("text"),
});
export type TextConfig = z.infer<typeof textConfigSchema>;

/**
 * Catalog entry for the text component.
 */
export const textEntry: CatalogEntry = {
	schema: textConfigSchema,
	description: "A single-line text input field",
	transformConfig: commonFieldTransform,
};

/**
 * Schema for email component configuration.
 */
export const emailConfigSchema = baseFieldConfigSchema.extend({
	type: z.literal("email"),
	placeholder: z.string().optional(),
	defaultValue: z.string().optional(),
	validation: z.object({
		required: z.boolean().optional(),
		email: z.union([z.string(), z.boolean()]).optional(),
	}).passthrough().optional(),
});
export type EmailConfig = z.infer<typeof emailConfigSchema>;

/**
 * Catalog entry for the email component.
 */
export const emailEntry: CatalogEntry = {
	schema: emailConfigSchema,
	description: "An email input field with email validation",
	transformConfig: commonFieldTransform,
};

/**
 * Schema for password component configuration.
 */
export const passwordConfigSchema = baseFieldConfigSchema.extend({
	type: z.literal("password"),
	placeholder: z.string().optional(),
	defaultValue: z.string().optional(),
});
export type PasswordConfig = z.infer<typeof passwordConfigSchema>;

/**
 * Catalog entry for the password component.
 */
export const passwordEntry: CatalogEntry = {
	schema: passwordConfigSchema,
	description: "A password input field with masked characters",
	transformConfig: commonFieldTransform,
};

/**
 * Schema for tel component configuration.
 */
export const telConfigSchema = baseFieldConfigSchema.extend({
	type: z.literal("tel"),
	placeholder: z.string().optional(),
	defaultValue: z.string().optional(),
	validation: z.object({
		required: z.boolean().optional(),
	}).passthrough().optional(),
});
export type TelConfig = z.infer<typeof telConfigSchema>;

/**
 * Catalog entry for the tel component.
 */
export const telEntry: CatalogEntry = {
	schema: telConfigSchema,
	description: "A telephone number input field",
	transformConfig: commonFieldTransform,
};

/**
 * Schema for number component configuration.
 */
export const numberConfigSchema = baseFieldConfigSchema.extend({
	type: z.literal("number"),
	placeholder: z.string().optional(),
	defaultValue: z.number().optional(),
	min: z.number().optional(),
	max: z.number().optional(),
	step: z.number().optional(),
	validation: z.object({
		required: z.boolean().optional(),
		min: z.union([z.number(), z.string()]).optional(),
		max: z.union([z.number(), z.string()]).optional(),
	}).passthrough().optional(),
});
export type NumberConfig = z.infer<typeof numberConfigSchema>;

/**
 * Catalog entry for the number component.
 */
export const numberEntry: CatalogEntry = {
	schema: numberConfigSchema,
	description: "A numeric input field with optional min/max/step constraints",
	transformConfig: commonFieldTransform,
};
