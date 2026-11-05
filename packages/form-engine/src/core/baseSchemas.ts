// packages/form-engine/src/core/baseSchemas.ts
//
// Base schemas shared by every component. All objects are strict: a key the
// schema does not know is reported rather than silently dropped, so typos in
// hand-written YAML and in model-generated patches surface immediately.
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

		// map top-level required into validation.required for back-compat
		if (typeof mutableData.required === "boolean") {
			mutableData.validation = {
				...(mutableData.validation || {}),
				required: mutableData.required,
			};
		}

		return mutableData;
}

// Defines the condition for a rule to be triggered.
// e.g., when: { field: 'someFieldId', is: true }
const ruleWhenSchema = z.object({
	field: z.string().min(1).describe("ID of the field whose value is checked"),
	is: z.any().describe("The value the field must equal (string, number, boolean, ...)"),
}).strict();
// Defines the 'set' action, which updates component properties.
// e.g., set: { required: true, label: 'A new dynamic label' }
const setActionSchema = z.object({
	set: z.record(z.string(), z.any()).describe("Properties to set on this component while the condition holds"),
}).strict();

// Defines the 'log' action for debugging purposes.
// e.g., log: ['User is applying, reason field is now required.']
const logActionSchema = z.object({
	log: z.array(z.string()).min(1, "Log action must have at least one message"),
}).strict();
// A rule can have different types of actions.
const ruleActionSchema = z.union([setActionSchema, logActionSchema]);

// A single rule object, containing the condition and the resulting actions.
// Back-compat: `when` supports simple equality checks. New: `whenLogic` supports JSONLogic.
export const ruleSchema = z.object({
	when: z.union([ruleWhenSchema, z.array(ruleWhenSchema)]).optional().describe("Equality condition(s); an array means all must match"),
	whenLogic: z.any().optional().describe("JSONLogic expression evaluated against { formData, context }"),
	then: z.array(ruleActionSchema).min(1, "A rule must have at least one action in its 'then' clause."),
}).strict().refine((obj) => typeof obj.when !== "undefined" || typeof obj.whenLogic !== "undefined", {
	message: "A rule must include either 'when' or 'whenLogic'",
	path: ["when"],
});
export type Rule = z.infer<typeof ruleSchema>;

// Base ZodObject for all UI components (layouts, static, fields)
export const baseComponentConfigSchema = z.object({
	id: z.string().optional(), // Optional for non-interactive elements like static HTML or layout containers
	type: z.string(), // Will be refined by specific component schemas (e.g., z.literal("text"))
	rules: z.array(ruleSchema).optional(),
	// universal component properties
	hidden: z.boolean().optional().describe("Hide the component; rules can set this dynamically"),
	condition: z.any().optional().describe("JSONLogic expression; the component renders only when it is truthy"),
}).strict();

// --- Validation -------------------------------------------------------------
// Every field accepts `validation.required`. Fields opt into further keys by
// extending one of the schemas below; the engine enforces each key it accepts
// (native constraint validation on the control, messages in the container).

export const baseValidationSchema = z.object({
	required: z.boolean().optional().describe("The field must have a value"),
}).strict();

/** Text-like fields: length and pattern constraints. */
export const textValidationSchema = baseValidationSchema.extend({
	minLength: z.number().int().nonnegative().optional().describe("Minimum string length"),
	maxLength: z.number().int().positive().optional().describe("Maximum string length"),
	pattern: z.string().optional().describe("Regular expression the value must match"),
});

/** Numeric fields: range constraints. */
export const numberValidationSchema = baseValidationSchema.extend({
	min: z.number().optional().describe("Minimum numeric value"),
	max: z.number().optional().describe("Maximum numeric value"),
});

export type BaseValidation = z.infer<typeof baseValidationSchema>;

// Base ZodObject for all field configurations to extend.
// This is a simple Zod object without any preprocessing directly attached to it.
// The preprocessing (like asterisk handling) is done by `commonFieldTransform`
// passed to `createComponent` in the component's definition file.
export const baseFieldConfigSchema = baseComponentConfigSchema.extend({
	id: z.string().min(1, "Field ID cannot be empty"), // id is required and non-empty for fields
	label: z.string().optional().describe("Label shown above the control; a trailing * marks the field required"),
	description: z.string().optional().describe("Help text shown under the label"),
	required: z.boolean().optional().describe("Shorthand for validation.required"),
	disabled: z.boolean().optional(),
	validation: baseValidationSchema.optional(),
});

export type BaseFieldConfig = z.infer<typeof baseFieldConfigSchema>;

// Base schema for layout components that can have children
export const baseLayoutComponentConfigSchema = baseComponentConfigSchema.extend({
	children: z.array(z.any()).optional(), // Children are validated by the registry, see validateSchemaTree()
});

export type BaseLayoutComponentConfig = z.infer<typeof baseLayoutComponentConfigSchema>;
