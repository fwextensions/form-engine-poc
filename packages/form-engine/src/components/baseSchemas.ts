// packages/form-engine/src/components/baseSchemas.ts
import { z } from "zod";

export const baseComponentConfigSchema = z.object({
	id: z.string().optional(), // id is optional for base components (like static HTML)
	type: z.string(),
	condition: z.any().optional(), // JSONLogic rule
});

// This is the base schema that all field components (Text, Checkbox, etc.) will extend.
// It makes 'id' required, as fields need a unique identifier which will also serve as their 'name' attribute.
export const extendableBaseFieldSchema = baseComponentConfigSchema.extend({
	// Override id from baseComponentConfigSchema to make it required and non-empty for fields.
	// This id will be used as the 'name' attribute for the HTML input element.
	id: z.string().min(1, { message: "Field ID is required and cannot be empty." }),
	// 'name' property is removed. 'id' will be used for field identification and submission.
	label: z.string().optional(),
	description: z.string().optional(),
	// Note: 'required' for field values (e.g., making a text input non-empty) is handled by individual field schemas
	// using Zod's .min(1) on their value validation, or by a specific validation schema extension.
});

// Example of a layout component base schema (remains unchanged)
export const baseLayoutComponentConfigSchema = baseComponentConfigSchema.extend({
	children: z.array(z.any()).optional(), // Typically, an array of other component configurations
});

// This schema can be used by the root "form" component or a "page" component
// to validate its children. It's a passthrough for any valid component config. (remains unchanged)
export const anyValidComponentConfigSchema = baseComponentConfigSchema.passthrough();
