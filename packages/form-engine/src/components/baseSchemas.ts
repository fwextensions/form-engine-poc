// packages/form-engine/src/components/baseSchemas.ts
import { z } from "zod";

export const baseComponentConfigSchema = z.object({
	id: z.string().optional(),
	type: z.string(),
	condition: z.any().optional(), // JSONLogic rule
	// other common props like className, style could go here
});

export const baseFieldConfigSchema = baseComponentConfigSchema.extend({
	name: z.string(), // The name attribute for the form field, used for data submission
	label: z.string().optional(),
	description: z.string().optional(),
	// Note: 'required' is handled by individual field schemas if they use Zod's .min(1) or similar,
	// or by a specific validation schema extension.
	// The automatic '*' detection for 'required' will be handled by the component's
	// schema parsing or transformProps logic if desired.
});

// Example of a layout component base schema
export const baseLayoutComponentConfigSchema = baseComponentConfigSchema.extend({
	children: z.array(z.any()).optional(), // Typically, an array of other component configurations
});

// This schema can be used by the root "form" component or a "page" component
// to validate its children. It's a passthrough for any valid component config.
export const anyValidComponentConfigSchema = baseComponentConfigSchema.passthrough();
