import yaml from "js-yaml";

export interface FormFieldOption {
	value: string;
	label: string;
}

export interface FieldValidation {
	required?: boolean;
	// Future validation types: minLength, maxLength, pattern, etc.
}

export interface FormField {
	id: string;
	type: string; // "text", "email", "password", "select", "checkbox", "radio", "date", "textarea"
	label: string;
	placeholder?: string;
	options?: FormFieldOption[]; // For select, radio
	validation?: FieldValidation;
}

export interface FormStep {
	id: string;
	title?: string;
	fields: FormField[];
}

export interface FormSchema {
	formName: string;
	steps: FormStep[];
	// Future properties: etc.
}

export function parseFormSchema(yamlString: string): FormSchema | null {
	try {
		const schema = yaml.load(yamlString) as FormSchema;
		// Basic validation (can be expanded)
		if (!schema || typeof schema !== "object") {
			throw new Error("Invalid schema structure: root is not an object.");
		}
		if (!schema.formName || typeof schema.formName !== "string") {
			throw new Error("Invalid schema: formName is missing or not a string.");
		}
		// Validate 'steps' array and its structure
		if (!Array.isArray(schema.steps) || schema.steps.length === 0) {
			throw new Error("Invalid schema: 'steps' must be a non-empty array.");
		}

		schema.steps.forEach((step, stepIndex) => {
			if (!step || typeof step !== "object") {
				throw new Error(`Invalid schema: step at index ${stepIndex} is not an object.`);
			}
			if (!step.id || typeof step.id !== "string") {
				throw new Error(`Invalid schema: step at index ${stepIndex} is missing an id or id is not a string.`);
			}
			if (step.title !== undefined && typeof step.title !== "string") {
				throw new Error(`Invalid schema: 'title' for step '${step.id}' must be a string if provided.`);
			}
			if (!Array.isArray(step.fields) || step.fields.length === 0) {
				throw new Error(`Invalid schema: 'fields' for step '${step.id}' must be a non-empty array.`);
			}

			// Re-use existing field validation logic for fields within each step
			step.fields.forEach((field, fieldIndex) => {
				if (!field || typeof field !== "object") {
					throw new Error(`Invalid schema: field at index ${fieldIndex} in step '${step.id}' is not an object.`);
				}
				if (!field.id || typeof field.id !== "string") {
					throw new Error(`Invalid schema: field at index ${fieldIndex} in step '${step.id}' is missing an id or id is not a string.`);
				}
				if (!field.type || typeof field.type !== "string") {
					throw new Error(`Invalid schema: field at index ${fieldIndex} in step '${step.id}' is missing a type or type is not a string.`);
				}
				if (!field.label || typeof field.label !== "string") {
					throw new Error(`Invalid schema: field at index ${fieldIndex} in step '${step.id}' is missing a label or label is not a string.`);
				}

				// Validate 'options' for select and radio types
				if (field.type === "select" || field.type === "radio") {
					if (!Array.isArray(field.options) || field.options.length === 0) {
						throw new Error(`Invalid schema: field '${field.id}' in step '${step.id}' of type '${field.type}' must have a non-empty 'options' array.`);
					}
					field.options.forEach((option, optIndex) => {
						if (!option || typeof option !== "object") {
							throw new Error(`Invalid schema: option at index ${optIndex} for field '${field.id}' in step '${step.id}' is not an object.`);
						}
						if (typeof option.value !== "string") {
							throw new Error(`Invalid schema: option at index ${optIndex} for field '${field.id}' in step '${step.id}' must have a string 'value'.`);
						}
						if (typeof option.label !== "string") {
							throw new Error(`Invalid schema: option at index ${optIndex} for field '${field.id}' in step '${step.id}' must have a string 'label'.`);
						}
					});
				}

				// Validate 'validation' object and its properties
				if (field.validation !== undefined) { // validation is optional
					if (typeof field.validation !== "object" || field.validation === null) {
						throw new Error(`Invalid schema: 'validation' for field '${field.id}' in step '${step.id}' must be an object.`);
					}
					if (field.validation.required !== undefined && typeof field.validation.required !== "boolean") {
						throw new Error(`Invalid schema: 'validation.required' for field '${field.id}' in step '${step.id}' must be a boolean.`);
					}
				}
			});
		});

		return schema;
	} catch (error) {
		console.error("Failed to parse YAML schema:", error);
		return null;
	}
}
