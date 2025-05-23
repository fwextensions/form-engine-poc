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
	label?: string;
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

export interface StaticHtml {
	id?: string; // Optional ID for static content
	type: "html"; // Discriminator
	content: string; // The HTML string or plain text
	tag?: string; // Optional HTML tag to wrap the content (e.g., 'p', 'div', 'span'). Defaults in component.
	className?: string; // Optional CSS classes for the component's container
	style?: React.CSSProperties; // Optional inline styles
}

export interface FormPage {
	id: string;
	type: "page"; // Literal type to ensure it's a page component
	title?: string;
	children: FormComponent[]; // Pages contain an array of FormComponent
}

// New discriminated union for all component types
export type FormComponent = FormField | FormPage | StaticHtml;

// Updated FormSchema interface
export interface FormSchema {
	title: string;
	display?: "multipage" | "singlepage"; // Optional display mode: defaults to single if undefined
	children: FormComponent[]; // Top-level children are expected to be FormComponent
	// Future properties: etc.
}

// Helper function for FormFieldContainer specific validation
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
	// Validate 'type' first, as it's needed for conditional 'id' validation
	if (!componentData.type || typeof componentData.type !== "string") {
		throw new Error(`Invalid component at ${path}: 'type' is missing or not a string.`);
	}

	// Conditional 'id' validation based on component type
	if (componentData.type !== "html") {
		// For non-HTML components, 'id' is required and must be a string
		if (!componentData.id || typeof componentData.id !== "string") {
			throw new Error(`Invalid component (type: ${componentData.type}) at ${path}: 'id' is missing or not a string.`);
		}
	} else {
		// For HTML components, 'id' is optional. If provided, it must be a string.
		if (componentData.id !== undefined && typeof componentData.id !== "string") {
			throw new Error(`Invalid component (type: html) at ${path}: 'id', if provided, must be a string.`);
		}
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

		case "html":
			// Validate StaticHtml specific properties
			if (componentData.content !== undefined && typeof componentData.content !== "string") {
				throw new Error(`Invalid static HTML component '${componentData.id || "(no id)"}' at ${path}: 'content' must be a string.`);
			}
			if (componentData.tag !== undefined && typeof componentData.tag !== "string") {
				throw new Error(`Invalid static HTML component '${componentData.id || "(no id)"}' at ${path}: 'tag' must be a string if provided.`);
			}
			return {
				id: componentData.id,
				type: "html",
				content: componentData.content,
				tag: componentData.tag,
				className: componentData.className,
				style: componentData.style,
			} as StaticHtml;

		// Add cases for other container types (e.g., "section") here in the future

		default:
			// Assume it's a FormFieldContainer type if not "page" (or other known container types)
			// Validate FormFieldContainer specific base properties
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

			// Delegate to a function for other FormFieldContainer-specific validations (options, validation rules etc.)
			validateFormFieldSpecifics(componentData, path);

			// This assumes componentData has all necessary FormFieldContainer properties plus id, type, label.
			return componentData as FormField;
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
