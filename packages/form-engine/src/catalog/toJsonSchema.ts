// packages/form-engine/src/catalog/toJsonSchema.ts
// Utility for converting catalog to JSON Schema
import { z } from "zod";
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
	const jsonSchema = zodSchemaToJsonSchema(schema);
	return name ? { ...jsonSchema, title: name } : jsonSchema;
}

/** Shared zod → JSON Schema conversion options used across the catalog. */
export const JSON_SCHEMA_OPTIONS = {
	io: "input",
	unrepresentable: "any",
	reused: "inline",
} as const;

/**
 * Converts a Zod schema to JSON Schema using zod's native converter.
 * `io: "input"` describes what authors write (so defaulted props stay optional),
 * and `unrepresentable: "any"` turns `z.any()` into an unconstrained schema
 * instead of throwing.
 */
export function zodSchemaToJsonSchema(schema: z.ZodType<any>): Record<string, any> {
	return z.toJSONSchema(schema, JSON_SCHEMA_OPTIONS) as Record<string, any>;
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
		const jsonSchema = { ...zodSchemaToJsonSchema(entry.schema), title: type };

		// Optionally add description from catalog entry
		if (includeDescriptions && entry.meta?.description) {
			if (typeof jsonSchema === "object" && jsonSchema !== null) {
				// Add description to the schema
				(jsonSchema as any).description = entry.meta.description;
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
		const actualSchema = { ...(schema as Record<string, any>) };
		delete actualSchema.$schema;
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
