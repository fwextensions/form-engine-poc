// packages/form-engine/src/components/baseSchemas.ts
import { z } from "zod";

// Shared transform function for common field config preprocessing (e.g., label asterisk)
export function commonFieldTransform(data: Record<string, any>)
{
    // It's crucial to work on a copy to avoid mutating the original object from the form config,
    // especially if the form config is memoized or part of React state.
    const mutableData = { ...data };

    if (mutableData.label && typeof mutableData.label === "string") {
        const trimmedLabel = mutableData.label.trim();
        if (trimmedLabel.endsWith("*")) {
            mutableData.label = trimmedLabel.slice(0, -1).trim();
            // Ensure validation object exists and merge
            mutableData.validation = {
                ...(mutableData.validation || {}),
                required: true,
            };
        }
    }

    return mutableData;
}

// Defines the condition for a rule to be triggered.
// e.g., when: { field: 'someFieldId', is: true }
const ruleWhenSchema = z.object({
	field: z.string().min(1),
	is: z.any(), // The value to check against. Can be string, number, boolean, etc.
});

// Defines the 'set' action, which updates component properties.
// e.g., set: { required: true, label: 'A new dynamic label' }
const setActionSchema = z.object({
	set: z.record(z.any()),
});

// Defines the 'log' action for debugging purposes.
// e.g., log: ['User is applying, reason field is now required.']
const logActionSchema = z.object({
	log: z.array(z.string()),
});

// A rule can have different types of actions.
const ruleActionSchema = z.union([setActionSchema, logActionSchema]);

// A single rule object, containing the condition and the resulting actions.
const ruleSchema = z.object({
	when: z.union([ruleWhenSchema, z.array(ruleWhenSchema)]),
	then: z.array(ruleActionSchema).min(1, "A rule must have at least one action in its 'then' clause."),
});

// Base ZodObject for all UI components (layouts, static, fields)
export const baseComponentConfigSchema = z.object({
	id: z.string().optional(), // Optional for non-interactive elements like static HTML or layout containers
	type: z.string(), // Will be refined by specific component schemas (e.g., z.literal("text"))
	rules: z.array(ruleSchema).optional(),
	// Add other truly universal component properties here, e.g., conditional visibility
});

// Base ZodObject for all field configurations to extend.
// This is a simple Zod object without any preprocessing directly attached to it.
// The preprocessing (like asterisk handling) is done by `commonFieldTransform`
// passed to `createComponent` in the component's definition file.
export const baseFieldConfigSchema = baseComponentConfigSchema.extend({
	id: z.string().min(1, "Field ID cannot be empty"), // id is required and non-empty for fields
	label: z.string().optional(), // Label is optional at the schema level; transform will handle '*' if present
	description: z.string().optional(),
	disabled: z.boolean().optional(), // Add disabled property
	hidden: z.boolean().optional(), // Add hidden property for conditional visibility
	validation: z
		.object({
			required: z.boolean().optional(),
			// Add other common validation properties here (e.g., minLength, pattern)
			// These would be validated by Zod after the transformConfig potentially sets them.
		})
		.passthrough() // Allows other validation props not explicitly defined here
		.optional(),
});

export type BaseFieldConfig = z.infer<typeof baseFieldConfigSchema>;

// Base schema for layout components that can have children
export const baseLayoutComponentConfigSchema = baseComponentConfigSchema.extend({
	children: z.array(z.any()).optional(), // Children will be parsed by a more generic schema or dispatcher
});

export type BaseLayoutComponentConfig = z.infer<typeof baseLayoutComponentConfigSchema>;
