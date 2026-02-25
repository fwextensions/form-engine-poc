/**
 * Converts catalog entries to JSON Schema.
 *
 * Useful for:
 * - Generating a JSON Schema file that editors can use for autocompletion
 * - Providing schema definitions to LLMs as structured context
 * - Validating form configurations externally
 */
import { zodToJsonSchema } from "zod-to-json-schema";
import type { Catalog } from "./catalog";

/**
 * Options for JSON Schema generation.
 */
export interface CatalogToJsonSchemaOptions {
	/** Name for the generated schema (used as definition name) */
	name?: string;
	/** Whether to include descriptions from catalog entries */
	includeDescriptions?: boolean;
}

/**
 * Converts a single Zod schema to JSON Schema.
 */
export function entryToJsonSchema(
	schema: Catalog["components"][string]["schema"],
	name?: string,
): Record<string, any> {
	return zodToJsonSchema(schema as any, name);
}

/**
 * Converts all catalog entries to individual JSON Schema definitions.
 * Returns a record of component types to their JSON Schema.
 */
export function catalogToJsonSchema(
	catalog: Catalog,
	options: CatalogToJsonSchemaOptions = {},
): Record<string, any> {
	const { includeDescriptions = true } = options;
	const schemas: Record<string, any> = {};

	for (const [type, entry] of Object.entries(catalog.components)) {
		const jsonSchema = zodToJsonSchema(entry.schema as any, type);

		if (includeDescriptions && entry.description) {
			if (typeof jsonSchema === "object" && jsonSchema !== null) {
				(jsonSchema as any).description = entry.description;
			}
		}

		schemas[type] = jsonSchema;
	}

	return schemas;
}

/**
 * Generates a combined JSON Schema with all component types as definitions.
 * Useful for creating a single schema file that validates any component.
 */
export function catalogToUnifiedJsonSchema(
	catalog: Catalog,
	options: CatalogToJsonSchemaOptions = {},
): Record<string, any> {
	const { name = "ComponentSchema" } = options;
	const componentSchemas = catalogToJsonSchema(catalog, options);

	const definitions: Record<string, any> = {};
	const oneOf: any[] = [];

	for (const [type, schema] of Object.entries(componentSchemas)) {
		const actualSchema = (schema as any).definitions?.[type] || schema;
		definitions[type] = actualSchema;
		oneOf.push({ $ref: `#/definitions/${type}` });
	}

	return {
		$schema: "http://json-schema.org/draft-07/schema#",
		title: name,
		definitions,
		oneOf,
	};
}
