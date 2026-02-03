// Manual verification script to see the actual output
// Run with: npx tsx packages/form-engine/src/catalog/__tests__/manual-verification.ts

import { z } from "zod";
import { generateCatalogPrompt } from "../prompt";
import type { Catalog } from "../catalog";

const catalog: Catalog = {
	components: {
		text: {
			schema: z.object({
				type: z.literal("text"),
				id: z.string().min(1),
				label: z.string().optional(),
				placeholder: z.string().optional(),
				defaultValue: z.string().default(""),
				validation: z.object({
					required: z.boolean().optional(),
					minLength: z.number().optional(),
					maxLength: z.number().optional(),
				}).optional(),
			}),
			description: "A text input field for single-line text entry",
		},
		form: {
			schema: z.object({
				type: z.literal("form"),
				id: z.string(),
				title: z.string().optional(),
			}),
			description: "The root form container",
			hasChildren: true,
		},
		checkbox: {
			schema: z.object({
				type: z.literal("checkbox"),
				id: z.string(),
				label: z.string().optional(),
				defaultChecked: z.boolean().default(false),
			}),
			description: "A checkbox input for boolean values",
		},
	},
};

console.log("=== WITHOUT EXAMPLES ===\n");
console.log(generateCatalogPrompt(catalog, { includeExamples: false }));

console.log("\n\n=== WITH EXAMPLES ===\n");
console.log(generateCatalogPrompt(catalog, { includeExamples: true }));
