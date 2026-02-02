// packages/form-engine/src/catalog/entries/form.ts
import { z } from "zod";
import type { CatalogEntry } from "../catalog";
import { baseLayoutComponentConfigSchema } from "../../core/baseSchemas";

/**
 * Schema for form component configuration.
 */
export const formConfigSchema = baseLayoutComponentConfigSchema.extend({
	type: z.literal("form"),
	title: z.string().optional(),
	display: z.enum(["multipage", "singlepage"]).optional(),
	submitButtonText: z.string().optional().default("Submit"),
	nextButtonText: z.string().optional().default("Next"),
	previousButtonText: z.string().optional().default("Previous"),
	buttonsClassName: z.string().optional(),
	previousButtonClassName: z.string().optional(),
	nextButtonClassName: z.string().optional(),
	submitButtonClassName: z.string().optional(),
	className: z.string().optional(),
	style: z.record(z.string(), z.any()).optional(),
});
export type FormConfig = z.infer<typeof formConfigSchema>;

/**
 * Catalog entry for the form component.
 */
export const formEntry: CatalogEntry = {
	schema: formConfigSchema,
	hasChildren: true,
	description: "Root form container that handles submission and multi-page navigation",
};
