// packages/form-engine/src/catalog/prompt.ts
// Generates LLM-consumable documentation from the component catalog

import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { Catalog, CatalogEntry } from "./catalog";

export interface CatalogPromptOptions {
	/** Include YAML examples for each component */
	includeExamples?: boolean;
	/** Custom preamble text */
	preamble?: string;
}

/**
 * Generates a markdown-formatted prompt describing the catalog
 * for LLM consumption.
 */
export function generateCatalogPrompt(
	catalog: Catalog,
	options?: CatalogPromptOptions
): string {
	const { includeExamples = false, preamble } = options || {};
	
	const sections: string[] = [];
	
	// 1. Preamble
	sections.push(preamble || getDefaultPreamble());
	
	// 2. Components documentation
	sections.push("## Available Components\n");
	
	const componentTypes = Object.keys(catalog.components).sort();
	
	for (const type of componentTypes) {
		const entry = catalog.components[type];
		sections.push(formatComponentDocumentation(type, entry, includeExamples));
	}
	
	// 3. Schema structure rules
	sections.push(getSchemaStructureRules());
	
	// 4. Conditional logic documentation
	sections.push(getConditionalLogicDocumentation());
	
	// 5. Validation rules documentation
	sections.push(getValidationRulesDocumentation());
	
	return sections.join("\n\n");
}

/**
 * Extracts human-readable property documentation from a Zod schema.
 * Returns markdown-formatted property list with types, constraints,
 * required/optional status, and defaults.
 */
export function formatPropsFromZodSchema(schema: z.ZodType<any>): string {
	try {
		// Convert Zod schema to JSON Schema for easier introspection
		const jsonSchema = zodToJsonSchema(schema as any, { $refStrategy: "none" });
		
		if (!jsonSchema || typeof jsonSchema !== "object" || !("properties" in jsonSchema)) {
			return "No properties defined.";
		}
		
		const properties = jsonSchema.properties as Record<string, any>;
		const required = (jsonSchema.required as string[]) || [];
		
		const propLines: string[] = [];
		
		for (const [propName, propSchema] of Object.entries(properties)) {
			const isRequired = required.includes(propName);
			const line = formatProperty(propName, propSchema, isRequired);
			propLines.push(line);
		}
		
		return propLines.length > 0 ? propLines.join("\n") : "No properties defined.";
	} catch (error) {
		return `Error extracting properties: ${error instanceof Error ? error.message : String(error)}`;
	}
}

/**
 * Formats a single property from JSON Schema into a readable line.
 */
function formatProperty(name: string, schema: any, isRequired: boolean): string {
	const parts: string[] = [];
	
	// Property name
	parts.push(`- **${name}**`);
	
	// Type
	const typeInfo = getTypeInfo(schema);
	parts.push(`(${typeInfo})`);
	
	// Required/Optional
	parts.push(isRequired ? "[Required]" : "[Optional]");
	
	// Default value
	if ("default" in schema) {
		parts.push(`Default: \`${JSON.stringify(schema.default)}\``);
	}
	
	// Constraints
	const constraints = getConstraints(schema);
	if (constraints.length > 0) {
		parts.push(`Constraints: ${constraints.join(", ")}`);
	}
	
	// Description
	if (schema.description) {
		parts.push(`- ${schema.description}`);
	}
	
	return parts.join(" ");
}

/**
 * Extracts type information from JSON Schema.
 */
function getTypeInfo(schema: any): string {
	if (schema.enum) {
		return `enum: ${schema.enum.map((v: any) => `"${v}"`).join(" | ")}`;
	}
	
	if (schema.const !== undefined) {
		return `literal: "${schema.const}"`;
	}
	
	if (schema.anyOf) {
		const types = schema.anyOf.map((s: any) => getTypeInfo(s)).join(" | ");
		return types;
	}
	
	if (schema.oneOf) {
		const types = schema.oneOf.map((s: any) => getTypeInfo(s)).join(" | ");
		return types;
	}
	
	if (schema.type === "array") {
		const itemType = schema.items ? getTypeInfo(schema.items) : "any";
		return `array<${itemType}>`;
	}
	
	if (schema.type === "object") {
		return "object";
	}
	
	return schema.type || "any";
}

/**
 * Extracts constraints from JSON Schema.
 */
function getConstraints(schema: any): string[] {
	const constraints: string[] = [];
	
	if (typeof schema.minLength === "number") {
		constraints.push(`minLength: ${schema.minLength}`);
	}
	
	if (typeof schema.maxLength === "number") {
		constraints.push(`maxLength: ${schema.maxLength}`);
	}
	
	if (typeof schema.minimum === "number") {
		constraints.push(`min: ${schema.minimum}`);
	}
	
	if (typeof schema.maximum === "number") {
		constraints.push(`max: ${schema.maximum}`);
	}
	
	if (typeof schema.minItems === "number") {
		constraints.push(`minItems: ${schema.minItems}`);
	}
	
	if (typeof schema.maxItems === "number") {
		constraints.push(`maxItems: ${schema.maxItems}`);
	}
	
	if (schema.pattern) {
		constraints.push(`pattern: ${schema.pattern}`);
	}
	
	return constraints;
}

/**
 * Formats documentation for a single component.
 */
function formatComponentDocumentation(
	type: string,
	entry: CatalogEntry,
	includeExamples: boolean
): string {
	const lines: string[] = [];
	
	lines.push(`### ${type}`);
	
	// Description
	if (entry.description) {
		lines.push(`\n${entry.description}`);
	}
	
	// Children capability
	if (entry.hasChildren) {
		lines.push("\n**Can contain children:** Yes");
	}
	
	// Properties
	lines.push("\n**Properties:**\n");
	lines.push(formatPropsFromZodSchema(entry.schema));
	
	// Example
	if (includeExamples) {
		const example = generateComponentExample(type, entry);
		if (example) {
			lines.push("\n**Example:**\n");
			lines.push("```yaml");
			lines.push(example);
			lines.push("```");
		}
	}
	
	return lines.join("\n");
}

/**
 * Generates a simple YAML example for a component.
 */
function generateComponentExample(type: string, entry: CatalogEntry): string | null {
	// Generate a basic example based on the component type
	// This is a simplified version - could be enhanced with more sophisticated example generation
	
	const lines: string[] = [];
	lines.push(`type: ${type}`);
	
	// Add id if it's likely a field component
	if (type !== "form" && type !== "page" && type !== "html") {
		lines.push(`id: example${type.charAt(0).toUpperCase() + type.slice(1)}`);
	}
	
	// Add common properties based on type
	if (["text", "email", "password", "tel", "number", "textarea", "select", "checkbox", "radio"].includes(type)) {
		lines.push(`label: Example ${type.charAt(0).toUpperCase() + type.slice(1)}`);
	}
	
	return lines.join("\n");
}

/**
 * Returns the default preamble text.
 */
function getDefaultPreamble(): string {
	return `# Form Engine Schema Documentation

You are a form schema generator. You create YAML schemas for a form engine that renders dynamic, multi-step forms with conditional logic and validation.

## Overview

The form engine uses a declarative YAML format to define forms. Each form consists of components that can be fields (text, select, checkbox, etc.), layout containers (pages, sections), or static content (HTML).

## Response Guidelines

**IMPORTANT:** Determine whether the user's request requires schema modification or is informational:

- **Informational requests** (e.g., "list the fields", "what fields are there", "show me the structure", "what's the email field id"): Respond with a clear text answer. DO NOT output a schema.
- **Modification requests** (e.g., "add a field", "change the label", "remove this field", "make it required"): Output the COMPLETE modified schema in a \`\`\`yaml code block.

## Output Format (for schema modifications)

- Always output valid YAML
- Wrap the schema in \`\`\`yaml code blocks
- Output the COMPLETE schema (not just changes when editing)
- You may include brief explanatory text before or after the schema, but keep it concise

## Rules

- Only use components from the catalog below
- Every field needs a unique \`id\` property
- Use \`validation.required: true\` for required fields
- Use \`rules\` for conditional logic (showing/hiding fields, changing properties)
- The root component should typically be a \`form\` containing \`page\` components for multi-step forms`;
}

/**
 * Returns schema structure rules documentation.
 */
function getSchemaStructureRules(): string {
	return `## Schema Structure Rules

### Basic Structure

A form schema is a YAML document with the following structure:

\`\`\`yaml
type: form
id: myForm
children:
  - type: page
    id: page1
    title: Page 1
    children:
      - type: text
        id: firstName
        label: First Name
        validation:
          required: true
\`\`\`

### Component Hierarchy

- **form**: The root container (required)
- **page**: Represents a step in a multi-step form
- **fields**: Input components (text, select, checkbox, etc.)
- **layout**: Containers and static content (html, section, etc.)

### ID Requirements

- Every interactive field MUST have a unique \`id\`
- IDs are used to reference field values in conditional logic
- IDs should be camelCase (e.g., \`firstName\`, \`emailAddress\`)
- Layout components (form, page) should also have IDs for navigation

### Children

- Components that support children use a \`children\` array property
- Children are rendered in the order they appear in the array`;
}

/**
 * Returns conditional logic documentation.
 */
function getConditionalLogicDocumentation(): string {
	return `## Conditional Logic (Rules System)

The form engine supports dynamic behavior through a rules system. Rules can show/hide fields, change properties, or trigger actions based on form state.

### Rule Structure

\`\`\`yaml
rules:
  - when:
      field: someFieldId
      is: expectedValue
    then:
      - set:
          hidden: false
          required: true
\`\`\`

### When Conditions

- **field**: The ID of the field to check
- **is**: The expected value (can be string, number, boolean, etc.)
- Multiple conditions can be specified as an array (AND logic)

### Then Actions

- **set**: Updates component properties dynamically
  - Can set any property: \`hidden\`, \`required\`, \`disabled\`, \`label\`, etc.
- **log**: Outputs debug messages (useful for development)

### Example: Conditional Required Field

\`\`\`yaml
- type: checkbox
  id: needsReason
  label: Do you need to provide a reason?

- type: textarea
  id: reason
  label: Reason
  hidden: true
  rules:
    - when:
        field: needsReason
        is: true
      then:
        - set:
            hidden: false
            required: true
\`\`\``;
}

/**
 * Returns validation rules documentation.
 */
function getValidationRulesDocumentation(): string {
	return `## Validation Rules

Fields support validation through the \`validation\` property.

### Common Validation Properties

- **required**: Boolean - field must have a value
- **minLength**: Number - minimum string length
- **maxLength**: Number - maximum string length
- **min**: Number - minimum numeric value
- **max**: Number - maximum numeric value
- **pattern**: String - regex pattern for validation
- **email**: Boolean - validates email format (for email fields)

### Example: Required Field with Length Constraints

\`\`\`yaml
- type: text
  id: username
  label: Username
  validation:
    required: true
    minLength: 3
    maxLength: 20
\`\`\`

### Shorthand: Asterisk for Required

You can append an asterisk to the label to mark a field as required:

\`\`\`yaml
- type: text
  id: email
  label: Email Address*
\`\`\`

This is equivalent to:

\`\`\`yaml
- type: text
  id: email
  label: Email Address
  validation:
    required: true
\`\`\``;
}
