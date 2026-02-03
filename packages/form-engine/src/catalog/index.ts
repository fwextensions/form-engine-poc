// packages/form-engine/src/catalog/index.ts
// Main catalog exports

// Core catalog types and functions
export {
	createCatalog,
	getCatalogEntry,
	getCatalogTypes,
	type Catalog,
	type CatalogEntry,
} from "./catalog";

// Auto-registered catalog - built automatically when components are imported
// This is the recommended way to access the catalog
export {
	getRegisteredCatalog,
	getRegisteredCatalogEntry,
} from "../core/componentFactory";

// JSON Schema utilities
export {
	catalogToJsonSchema,
	catalogToUnifiedJsonSchema,
	entryToJsonSchema,
	type CatalogToJsonSchemaOptions,
} from "./toJsonSchema";

// LLM Prompt Generation utilities
export {
	generateCatalogPrompt,
	formatPropsFromZodSchema,
	type CatalogPromptOptions,
} from "./prompt";

// Note: The catalog is now built automatically via createComponent() calls.
// Each component file defines its own schema and registers it.
// Use getRegisteredCatalog() to access the complete catalog.
