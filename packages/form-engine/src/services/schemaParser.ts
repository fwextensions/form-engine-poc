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

// New discriminated union for all component types
export type FormComponent = FormField | FormPage;

// New interface for Page components
export interface FormPage {
	id: string;
	type: "page"; // Literal type to ensure it's a page component
	title?: string;
	children: FormComponent[]; // Pages contain an array of FormComponent
}

// Updated FormSchema interface
export interface FormSchema {
	title: string;
	display?: "multipage" | "singlepage"; // Optional display mode: defaults to single if undefined
	children: FormComponent[]; // Top-level children are expected to be FormComponent
	// Future properties: etc.
}

// Helper function for FormField specific validation
function validateFormFieldSpecifics(fieldData: any, path: string): void {
	// Validate 'options' for select and radio types
	if (fieldData.type === "select" || fieldData.type === "radio") {
		if (!Array.isArray(fieldData.options) || fieldData.options.length === 0) {
			throw new Error(
				`Invalid schema: field '${fieldData.id}' at ${path} of type '${fieldData.type}' must have a non-empty 'options' array.`
			);
		}
		fieldData.options.forEach((option: any, optIndex: number) => {
			if (!option || typeof option !== "object") {
				throw new Error(
					`Invalid schema: option at index ${optIndex} for field '${fieldData.id}' at ${path} is not an object.`
				);
			}
			if (typeof option.value !== "string") {
				throw new Error(
					`Invalid schema: option at index ${optIndex} for field '${fieldData.id}' at ${path} must have a string 'value'.`
				);
			}
			if (typeof option.label !== "string") {
				throw new Error(
					`Invalid schema: option at index ${optIndex} for field '${fieldData.id}' at ${path} must have a string 'label'.`
				);
			}
		});
	}

	// Validate 'validation' object and its properties
	if (fieldData.validation !== undefined) { // validation is optional
		if (typeof fieldData.validation !== "object" || fieldData.validation === null) {
			throw new Error(
				`Invalid schema: 'validation' for field '${fieldData.id}' at ${path} must be an object.`
			);
		}
		if (fieldData.validation.required !== undefined && typeof fieldData.validation.required !== "boolean") {
			throw new Error(
				`Invalid schema: 'validation.required' for field '${fieldData.id}' at ${path} must be a boolean.`
			);
		}
	}
	// Add other field-specific validations here as needed (e.g., rows for textarea, placeholder types)
}

function parseComponent(componentData: any, path: string): FormComponent {
	// Validate common properties for any component
	if (!componentData || typeof componentData !== "object") {
		throw new Error(`Invalid component at ${path}: not an object.`);
	}
	if (!componentData.id || typeof componentData.id !== "string") {
		throw new Error(`Invalid component at ${path}: 'id' is missing or not a string.`);
	}
	if (!componentData.type || typeof componentData.type !== "string") {
		throw new Error(`Invalid component at ${path}: 'type' is missing or not a string.`);
	}

	switch (componentData.type) {
		case "page":
			// Validate FormPage specific properties
			if (componentData.title !== undefined && typeof componentData.title !== "string") {
				throw new Error(`Invalid page component '${componentData.id}' at ${path}: 'title' must be a string if provided.`);
			}
			if (!Array.isArray(componentData.children) || componentData.children.length === 0) {
				throw new Error(`Invalid page component '${componentData.id}' at ${path}: 'children' must be a non-empty array.`);
			}
			// Recursively parse children of the page
			const pageChildren: FormComponent[] = componentData.children.map((childData: any, index: number) => {
				return parseComponent(childData, `${path}.children[${index}]`);
			});
			return {
				id: componentData.id,
				type: "page",
				title: componentData.title,
				children: pageChildren,
			} as FormPage;

		// Add cases for other container types (e.g., "section") here in the future

		default:
			// Assume it's a FormField type if not "page" (or other known container types)
			// Validate FormField specific base properties
			if (!componentData.label || typeof componentData.label !== "string") {
				throw new Error(`Invalid field component '${componentData.id}' at ${path}: 'label' is missing or not a string.`);
			}

			let label = componentData.label as string;
			const trimmedLabel = label.trim();

			// Check for asterisk in label to imply required, ignoring surrounding whitespace
			if (trimmedLabel.endsWith("*")) {
				label = trimmedLabel.slice(0, -1).trim(); // Remove asterisk and trim again
				componentData.label = label;
				if (!componentData.validation) {
					componentData.validation = {};
				}
				componentData.validation.required = true;
			}

			// Delegate to a function for other FormField-specific validations (options, validation rules etc.)
			validateFormFieldSpecifics(componentData, path);

			// Construct and return the FormField object
			// This assumes componentData has all necessary FormField properties plus id, type, label.
			return {
				id: componentData.id,
				type: componentData.type, // This is the field type like "text", "select"
				label: componentData.label,
				description: componentData.description,
				placeholder: componentData.placeholder,
				options: componentData.options,
				rows: componentData.rows,
				validation: componentData.validation,
				className: componentData.className,
				style: componentData.style,
				disabled: componentData.disabled,
				readOnly: componentData.readOnly,
				autoFocus: componentData.autoFocus,
				tabIndex: componentData.tabIndex,
				autoComplete: componentData.autoComplete,
			} as FormField;
	}
}

export function parseFormSchema(rawSchema: any): FormSchema | null {
	try {
		// 1. Validate root schema object
		if (!rawSchema || typeof rawSchema !== "object") {
			throw new Error("Invalid schema: root is not an object.");
		}
		if (!rawSchema.title || typeof rawSchema.title !== "string") {
			throw new Error("Invalid schema: 'title' is missing or not a string.");
		}
		if (
			rawSchema.display !== undefined &&
			typeof rawSchema.display !== "string" &&
			rawSchema.display !== "multipage" &&
			rawSchema.display !== "singlepage"
		) {
			throw new Error("Invalid schema: 'display' must be 'multipage' or 'singlepage' if provided.");
		}

		// 2. Validate root children array
		if (!Array.isArray(rawSchema.children) || rawSchema.children.length === 0) {
			throw new Error("Invalid schema: 'children' must be a non-empty array.");
		}

		// 3. Parse and validate each top-level component
		const parsedChildren: FormComponent[] = rawSchema.children.map((componentData: any, index: number) => {
			return parseComponent(componentData, `schema.children[${index}]`);
		});

		return {
			title: rawSchema.title,
			display: rawSchema.display,
			children: parsedChildren,
		} as FormSchema; // Cast to FormSchema after successful parsing

	} catch (e: any) {
		console.error("Schema parsing error:", e.message);
		return null;
	}
}
