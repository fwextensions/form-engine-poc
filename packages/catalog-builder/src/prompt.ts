/**
 * Generates LLM-consumable documentation from a component catalog.
 *
 * The prompt includes:
 * - A configurable preamble describing the schema system
 * - Per-component documentation derived from Zod schemas
 * - Optional YAML examples
 * - Optional custom sections (e.g. conditional logic, validation rules)
 */
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { Catalog, CatalogEntry } from "./catalog";

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface CatalogPromptOptions {
	/** Include YAML examples for each component */
	includeExamples?: boolean;
	/**
	 * Custom preamble text placed at the very start of the prompt.
	 * If omitted a sensible generic default is used.
	 */
	preamble?: string;
	/**
	 * Additional markdown sections appended after the component docs.
	 * Use this to add project-specific rules like conditional logic docs,
	 * validation rules, hierarchy constraints, etc.
	 */
	additionalSections?: string[];
	/**
	 * Custom function to generate a YAML example for a given component type.
	 * If omitted a basic example is auto-generated.
	 */
	exampleGenerator?: (type: string, entry: CatalogEntry) => string | null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generates a complete markdown-formatted prompt describing the catalog
 * for LLM consumption.
 */
export function generateCatalogPrompt(
	catalog: Catalog,
	options?: CatalogPromptOptions,
): string {
	const {
		includeExamples = false,
		preamble,
		additionalSections,
		exampleGenerator,
	} = options || {};

	const sections: string[] = [];

	// 1. Preamble
	sections.push(preamble || getDefaultPreamble());

	// 2. Components documentation
	sections.push("## Available Components\n");

	const componentTypes = Object.keys(catalog.components).sort();

	for (const type of componentTypes) {
		const entry = catalog.components[type];
		sections.push(formatComponentDocumentation(type, entry, includeExamples, exampleGenerator));
	}

	// 3. Additional sections
	if (additionalSections) {
		for (const section of additionalSections) {
			sections.push(section);
		}
	}

	return sections.join("\n\n");
}

/**
 * Extracts human-readable property documentation from a Zod schema.
 * Returns markdown-formatted property list with types, constraints,
 * required/optional status, and defaults.
 */
export function formatPropsFromZodSchema(schema: z.ZodType<any>): string {
	try {
		const jsonSchema = zodToJsonSchema(schema as any, { $refStrategy: "none" });

		if (!jsonSchema || typeof jsonSchema !== "object" || !("properties" in jsonSchema)) {
			return "No properties defined.";
		}

		const properties = jsonSchema.properties as Record<string, any>;
		const required = (jsonSchema.required as string[]) || [];

		const propLines: string[] = [];

		for (const [propName, propSchema] of Object.entries(properties)) {
			const isRequired = required.includes(propName);
			propLines.push(formatProperty(propName, propSchema, isRequired));
		}

		return propLines.length > 0 ? propLines.join("\n") : "No properties defined.";
	} catch (error) {
		return `Error extracting properties: ${error instanceof Error ? error.message : String(error)}`;
	}
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function formatProperty(name: string, schema: any, isRequired: boolean): string {
	const parts: string[] = [];

	parts.push(`- **${name}**`);

	const typeInfo = getTypeInfo(schema);
	parts.push(`(${typeInfo})`);

	parts.push(isRequired ? "[Required]" : "[Optional]");

	if ("default" in schema) {
		parts.push(`Default: \`${JSON.stringify(schema.default)}\``);
	}

	const constraints = getConstraints(schema);
	if (constraints.length > 0) {
		parts.push(`Constraints: ${constraints.join(", ")}`);
	}

	if (schema.description) {
		parts.push(`- ${schema.description}`);
	}

	return parts.join(" ");
}

function getTypeInfo(schema: any): string {
	if (schema.enum) {
		return `enum: ${schema.enum.map((v: any) => `"${v}"`).join(" | ")}`;
	}
	if (schema.const !== undefined) {
		return `literal: "${schema.const}"`;
	}
	if (schema.anyOf) {
		return schema.anyOf.map((s: any) => getTypeInfo(s)).join(" | ");
	}
	if (schema.oneOf) {
		return schema.oneOf.map((s: any) => getTypeInfo(s)).join(" | ");
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

function getConstraints(schema: any): string[] {
	const constraints: string[] = [];
	if (typeof schema.minLength === "number") constraints.push(`minLength: ${schema.minLength}`);
	if (typeof schema.maxLength === "number") constraints.push(`maxLength: ${schema.maxLength}`);
	if (typeof schema.minimum === "number") constraints.push(`min: ${schema.minimum}`);
	if (typeof schema.maximum === "number") constraints.push(`max: ${schema.maximum}`);
	if (typeof schema.minItems === "number") constraints.push(`minItems: ${schema.minItems}`);
	if (typeof schema.maxItems === "number") constraints.push(`maxItems: ${schema.maxItems}`);
	if (schema.pattern) constraints.push(`pattern: ${schema.pattern}`);
	return constraints;
}

function formatComponentDocumentation(
	type: string,
	entry: CatalogEntry,
	includeExamples: boolean,
	exampleGenerator?: (type: string, entry: CatalogEntry) => string | null,
): string {
	const lines: string[] = [];

	lines.push(`### ${type}`);

	if (entry.description) {
		lines.push(`\n${entry.description}`);
	}

	if (entry.hasChildren) {
		lines.push("\n**Can contain children:** Yes");
	}

	lines.push("\n**Properties:**\n");
	lines.push(formatPropsFromZodSchema(entry.schema));

	if (includeExamples) {
		const example = exampleGenerator
			? exampleGenerator(type, entry)
			: generateDefaultExample(type);
		if (example) {
			lines.push("\n**Example:**\n");
			lines.push("```yaml");
			lines.push(example);
			lines.push("```");
		}
	}

	return lines.join("\n");
}

function generateDefaultExample(type: string): string {
	const lines: string[] = [];
	lines.push(`type: ${type}`);
	lines.push(`id: example${type.charAt(0).toUpperCase() + type.slice(1)}`);
	return lines.join("\n");
}

function getDefaultPreamble(): string {
	return `# Schema Documentation

You are a schema generator. You create YAML schemas for a component system that renders dynamic forms and UIs.

## Overview

The system uses a declarative YAML format to define component trees. Each schema consists of typed components that can be fields, layout containers, or static content.

## Response Guidelines

**IMPORTANT:** Determine whether the user's request requires schema modification or is informational:

- **Informational requests** (e.g., "list the fields", "what components exist"): Respond with a clear text answer. DO NOT output a schema.
- **Modification requests** (e.g., "add a field", "change the label"): Output the COMPLETE modified schema in a \`\`\`yaml code block.

## Output Format (for schema modifications)

- Always output valid YAML
- Wrap the schema in \`\`\`yaml code blocks
- Output the COMPLETE schema (not just changes when editing)

## YAML Formatting Rules (CRITICAL)

String values containing special characters MUST be quoted to avoid YAML syntax errors:

- **Always quote strings containing:** \`:\`, \`#\`, \`>\`, \`<\`, \`{\`, \`}\`, \`[\`, \`]\`, \`&\`, \`*\`, \`!\`, \`|\`, \`?\`, \`@\`, \`%\`, or newlines
- **HTML content MUST be quoted** - use double quotes or block scalar syntax

## Rules

- Only use components from the catalog below
- Every field needs a unique \`id\` property`;
}
