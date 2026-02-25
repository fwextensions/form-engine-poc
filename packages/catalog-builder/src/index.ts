/**
 * catalog-builder
 *
 * A generic component catalog toolkit for schema-driven systems.
 *
 * Register component types with Zod schemas, then use the catalog to:
 * - Generate LLM prompts so an AI can build schemas with those components
 * - Produce JSON Schema definitions for editors and validators
 * - Validate schemas against the registered catalog
 * - Extract YAML from LLM responses
 *
 * This package has no React dependency. It is designed to be used as a
 * foundation library that any schema-driven project can plug into.
 *
 * ## Quick Start
 *
 * ```ts
 * import {
 *   registerComponent,
 *   getRegisteredCatalog,
 *   SchemaGenerator,
 * } from "catalog-builder";
 * import { z } from "zod";
 *
 * // 1. Register your component types
 * registerComponent({
 *   type: "text",
 *   schema: z.object({ type: z.literal("text"), id: z.string(), label: z.string() }),
 *   description: "Single-line text input",
 * });
 *
 * // 2. Build a catalog and create an LLM prompt
 * const catalog = getRegisteredCatalog();
 * const generator = new SchemaGenerator(catalog);
 * const systemPrompt = generator.getSystemPrompt();
 *
 * // 3. Send systemPrompt as the system message to any LLM provider
 * ```
 */

// ---------------------------------------------------------------------------
// Catalog – types, registration, and access
// ---------------------------------------------------------------------------
export {
	// Types
	type Catalog,
	type CatalogEntry,
	type RegisterComponentArgs,
	// Global registry
	registerComponent,
	registerComponents,
	getRegisteredCatalog,
	getRegisteredCatalogEntry,
	clearRegistry,
	// Standalone catalog helpers
	createCatalog,
	getCatalogEntry,
	getCatalogTypes,
} from "./catalog";

// ---------------------------------------------------------------------------
// JSON Schema generation
// ---------------------------------------------------------------------------
export {
	catalogToJsonSchema,
	catalogToUnifiedJsonSchema,
	entryToJsonSchema,
	type CatalogToJsonSchemaOptions,
} from "./toJsonSchema";

// ---------------------------------------------------------------------------
// LLM prompt generation
// ---------------------------------------------------------------------------
export {
	generateCatalogPrompt,
	formatPropsFromZodSchema,
	type CatalogPromptOptions,
} from "./prompt";

// ---------------------------------------------------------------------------
// SchemaGenerator (high-level LLM integration)
// ---------------------------------------------------------------------------
export { SchemaGenerator, type SchemaGeneratorOptions } from "./schemaGenerator";

// ---------------------------------------------------------------------------
// YAML extraction from LLM responses
// ---------------------------------------------------------------------------
export { extractYamlFromResponse, extractTextAfterYaml } from "./yamlExtractor";

// ---------------------------------------------------------------------------
// Schema validation against a catalog
// ---------------------------------------------------------------------------
export { validateAgainstCatalog, type ValidationResult } from "./validate";
