/* eslint-disable @typescript-eslint/no-explicit-any */
import * as z from "zod";

// Zod schema for FormFieldOption
export const ZodFormFieldOptionSchema = z.object({
	value: z.string({ required_error: "Option 'value' is required" }),
	label: z.string({ required_error: "Option 'label' is required" }),
}).strict();
export type FormFieldOption = z.infer<typeof ZodFormFieldOptionSchema>;

// Zod schema for FieldValidation
export const ZodFieldValidationSchema = z.object({
	required: z.boolean().optional(),
	// Future validation types: minLength, maxLength, pattern, etc.
}).strict();
export type FieldValidation = z.infer<typeof ZodFieldValidationSchema>;

// Base Zod schema for common FormField properties
const ZodBaseFieldSchema = z.object({
	id: z.string({ required_error: "Field 'id' is required" }),
	// label is initially required as a string; asterisk logic is handled in ZodFormComponentSchema's preprocess
	label: z.string().optional(),
	description: z.string().optional(),
	placeholder: z.string().optional(),
	className: z.string().optional(),
	style: z.record(z.string(), z.any()).optional(), // Approximates React.CSSProperties
	disabled: z.boolean().optional(),
	readOnly: z.boolean().optional(),
	autoFocus: z.boolean().optional(),
	tabIndex: z.number().int().optional(),
	autoComplete: z.string().optional(),
	validation: ZodFieldValidationSchema.optional(),
});

// Specific Zod schemas for each field type
const ZodTextFieldSchema = ZodBaseFieldSchema.extend({ type: z.literal("text") }).strict();
const ZodEmailFieldSchema = ZodBaseFieldSchema.extend({ type: z.literal("email") }).strict();
const ZodPasswordFieldSchema = ZodBaseFieldSchema.extend({ type: z.literal("password") }).strict();
const ZodSelectFieldSchema = ZodBaseFieldSchema.extend({
	type: z.literal("select"),
	options: z.array(ZodFormFieldOptionSchema).min(1, "Select field must have at least one option"),
}).strict();
const ZodCheckboxFieldSchema = ZodBaseFieldSchema.extend({ type: z.literal("checkbox") }).strict();
const ZodRadioFieldSchema = ZodBaseFieldSchema.extend({
	type: z.literal("radio"),
	options: z.array(ZodFormFieldOptionSchema).min(1, "Radio field must have at least one option"),
}).strict();
const ZodDateFieldSchema = ZodBaseFieldSchema.extend({ type: z.literal("date") }).strict();
const ZodTextareaFieldSchema = ZodBaseFieldSchema.extend({
	type: z.literal("textarea"),
	rows: z.number().int().positive().optional(),
}).strict();

// Union of all specific field schemas (represents the possible structures for a field before asterisk transform)
const AnyUntransformedFieldSchema = z.discriminatedUnion("type", [
	ZodTextFieldSchema,
	ZodEmailFieldSchema,
	ZodPasswordFieldSchema,
	ZodSelectFieldSchema,
	ZodCheckboxFieldSchema,
	ZodRadioFieldSchema,
	ZodDateFieldSchema,
	ZodTextareaFieldSchema,
]);

// This type is what ZodFormComponentSchema will output for fields after preprocessing
export type FormField = z.output<typeof AnyUntransformedFieldSchema> & { validation?: { required?: boolean } };

// Zod schema for StaticHtml
export const ZodStaticHtmlSchema = z.object({
	id: z.string().optional(), // id is optional for html
	type: z.literal("html"),
	content: z.string().optional(), // Made content optional
	tag: z.string().optional(),
	className: z.string().optional(),
	style: z.record(z.string(), z.any()).optional(),
}).strict();
export type StaticHtml = z.infer<typeof ZodStaticHtmlSchema>;

// Forward declaration for ZodFormComponentSchema used in ZodFormPageSchema
// eslint-disable-next-line prefer-const -- needs to be let for lazy assignment
let ZodFormComponentSchema: z.ZodTypeAny;

// Zod schema for FormPage
export const ZodFormPageSchema = z.object({
	id: z.string({ required_error: "Page 'id' is required" }),
	type: z.literal("page"),
	title: z.string().optional(),
	children: z.array(z.lazy(() => ZodFormComponentSchema)).min(1, "Page 'children' must be a non-empty array"),
}).strict();
export type FormPage = z.infer<typeof ZodFormPageSchema>;

// ZodFormComponentSchema: Handles dispatch to Page, HTML, or one of the Field types
// Includes preprocessing step for the label asterisk logic for field types.
ZodFormComponentSchema = z.preprocess(
	(componentData: any) => {
		if (componentData && typeof componentData === "object" && componentData.type && typeof componentData.type === "string") {
			// Apply asterisk logic only if it's a field type (not 'page' or 'html')
			if (componentData.type !== "page" && componentData.type !== "html") {
				if (componentData.label && typeof componentData.label === "string") {
					const trimmedLabel = componentData.label.trim();
					if (trimmedLabel.endsWith("*")) {
						return {
							...componentData,
							label: trimmedLabel.slice(0, -1).trim(),
							validation: {
								...(componentData.validation || {}),
								required: true,
							},
						};
					}
				}
			}
		}
		return componentData;
	},
	z.discriminatedUnion("type", [
		ZodFormPageSchema,       // Must be actual ZodObject schemas
		ZodStaticHtmlSchema,
		// Add all specific (untransformed) field schemas here for the discriminated union
		ZodTextFieldSchema,
		ZodEmailFieldSchema,
		ZodPasswordFieldSchema,
		ZodSelectFieldSchema,
		ZodCheckboxFieldSchema,
		ZodRadioFieldSchema,
		ZodDateFieldSchema,
		ZodTextareaFieldSchema,
	])
);
export type FormComponent = z.infer<typeof ZodFormComponentSchema>;

// Zod schema for the root FormSchema
export const ZodFormSchema = z.object({
	title: z.string({ required_error: "Form 'title' is required" }),
	display: z.enum(["multipage", "singlepage"]).optional(),
	children: z.array(ZodFormComponentSchema).min(1, "Form 'children' must be a non-empty array"),
	// Future properties: etc.
}).strict();
export type FormSchema = z.infer<typeof ZodFormSchema>;

/**
 * Parses a raw JavaScript object (presumably from YAML/JSON) into a typed FormSchema.
 * Uses Zod for validation. Throws ZodError if validation fails.
 * @param rawSchema The raw schema object.
 * @returns The validated FormSchema object.
 * @throws ZodError if schema validation fails.
 */
export function parseFormSchema(rawSchema: unknown): FormSchema {
	// Zod's .parse() will throw a ZodError if validation fails, which includes detailed path information.
	const result = ZodFormSchema.safeParse(rawSchema);
	if (!result.success) {
		// Optional: Re-throw or process ZodError for custom error handling/logging
		// For now, just log the formatted error and re-throw the original for detailed stack by Zod
		console.error("Schema validation failed:", result.error.format());
		throw result.error; // Or throw new Error("Schema validation failed. Check console for details.");
	}
	return result.data;
}
