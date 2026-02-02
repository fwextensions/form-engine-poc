// packages/form-engine/src/catalog/toJsonSchema.ts
// Utility for converting catalog to JSON Schema
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
 * Converts a single catalog entry's Zod schema to JSON Schema.
 */
export function entryToJsonSchema(
	schema: Catalog["components"][string]["schema"],
	name?: string
): Record<string, any> {
	return zodToJsonSchema(schema, name);
}

/**
 * Converts all catalog entries to JSON Schema format.
 * Returns a record of component types to their JSON Schema definitions.
 */
export function catalogToJsonSchema(
	catalog: Catalog,
	options: CatalogToJsonSchemaOptions = {}
): Record<string, any> {
	const { includeDescriptions = true } = options;
	const schemas: Record<string, any> = {};

	for (const [type, entry] of Object.entries(catalog.components)) {
		const jsonSchema = zodToJsonSchema(entry.schema, type);

		// Optionally add description from catalog entry
		if (includeDescriptions && entry.description) {
			if (typeof jsonSchema === "object" && jsonSchema !== null) {
				// Add description to the schema
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
	options: CatalogToJsonSchemaOptions = {}
): Record<string, any> {
	const { name = "ComponentSchema" } = options;
	const componentSchemas = catalogToJsonSchema(catalog, options);

	// Create a unified schema with all components as definitions
	const definitions: Record<string, any> = {};
	const oneOf: any[] = [];

	for (const [type, schema] of Object.entries(componentSchemas)) {
		// Extract the actual schema definition (zod-to-json-schema wraps it)
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
