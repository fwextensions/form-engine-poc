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
	description?: string;
	placeholder?: string;
	options?: FormFieldOption[]; // For select, radio
	rows?: number; // For textarea
	validation?: FieldValidation;
	className?: string;
	style?: React.CSSProperties;
	disabled?: boolean;
	readOnly?: boolean;
	autoFocus?: boolean;
	tabIndex?: number;
	autoComplete?: string;
}

// New interface for Page components
export interface PageComponentDefinition {
	id: string;
	type: "page"; // Literal type to ensure it's a page component
	title?: string;
	children: FormField[]; // Pages contain an array of FormFields
}

// Updated FormSchema interface
export interface FormSchema {
	title: string;
	children: PageComponentDefinition[]; // Top-level children are expected to be pages
	// Future properties: etc.
}

export function parseFormSchema(yamlString: string): FormSchema | null {
	try {
		const schema = yaml.load(yamlString) as FormSchema;
		// Basic validation for the root schema object
		if (!schema || typeof schema !== "object") {
			throw new Error("Invalid schema structure: root is not an object.");
		}
		if (!schema.title || typeof schema.title !== "string") {
			throw new Error("Invalid schema: 'title' is missing or not a string.");
		}

		// Validate 'children' array (expecting page components)
		if (!Array.isArray(schema.children) || schema.children.length === 0) {
			throw new Error("Invalid schema: 'children' must be a non-empty array of page components.");
		}

		schema.children.forEach((page, pageIndex) => {
			if (!page || typeof page !== "object") {
				throw new Error(
					`Invalid schema: component at children index ${pageIndex} is not an object.`
				);
			}
			if (page.type !== "page") {
				throw new Error(
					`Invalid schema: component at children index ${pageIndex} has type '${page.type}' but expected 'page'.`
				);
			}
			if (!page.id || typeof page.id !== "string") {
				throw new Error(
					`Invalid schema: page component at children index ${pageIndex} is missing an 'id' or 'id' is not a string.`
				);
			}
			if (page.title !== undefined && typeof page.title !== "string") {
				throw new Error(
					`Invalid schema: 'title' for page '${page.id}' must be a string if provided.`
				);
			}
			if (!Array.isArray(page.children) || page.children.length === 0) {
				throw new Error(
					`Invalid schema: 'children' for page '${page.id}' must be a non-empty array of fields.`
				);
			}

			// Validate fields within each page component
			page.children.forEach((field, fieldIndex) => {
				if (!field || typeof field !== "object") {
					throw new Error(
						`Invalid schema: field at index ${fieldIndex} in page '${page.id}' is not an object.`
					);
				}
				if (!field.id || typeof field.id !== "string") {
					throw new Error(
						`Invalid schema: field at index ${fieldIndex} in page '${page.id}' is missing an 'id' or 'id' is not a string.`
					);
				}
				if (!field.type || typeof field.type !== "string") {
					throw new Error(
						`Invalid schema: field at index ${fieldIndex} in page '${page.id}' is missing a 'type' or 'type' is not a string.`
					);
				}
				if (!field.label || typeof field.label !== "string") {
					throw new Error(
						`Invalid schema: field at index ${fieldIndex} in page '${page.id}' is missing a 'label' or 'label' is not a string.`
					);
				}

				// Validate 'options' for select and radio types
				if (field.type === "select" || field.type === "radio") {
					if (!Array.isArray(field.options) || field.options.length === 0) {
						throw new Error(
							`Invalid schema: field '${field.id}' in page '${page.id}' of type '${field.type}' must have a non-empty 'options' array.`
						);
					}
					field.options.forEach((option, optIndex) => {
						if (!option || typeof option !== "object") {
							throw new Error(
								`Invalid schema: option at index ${optIndex} for field '${field.id}' in page '${page.id}' is not an object.`
							);
						}
						if (typeof option.value !== "string") {
							throw new Error(
								`Invalid schema: option at index ${optIndex} for field '${field.id}' in page '${page.id}' must have a string 'value'.`
							);
						}
						if (typeof option.label !== "string") {
							throw new Error(
								`Invalid schema: option at index ${optIndex} for field '${field.id}' in page '${page.id}' must have a string 'label'.`
							);
						}
					});
				}

				// Validate 'validation' object and its properties
				if (field.validation !== undefined) { // validation is optional
					if (typeof field.validation !== "object" || field.validation === null) {
						throw new Error(
							`Invalid schema: 'validation' for field '${field.id}' in page '${page.id}' must be an object.`
						);
					}
					if (field.validation.required !== undefined && typeof field.validation.required !== "boolean") {
						throw new Error(
							`Invalid schema: 'validation.required' for field '${field.id}' in page '${page.id}' must be a boolean.`
						);
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
