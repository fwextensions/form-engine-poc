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

// Default catalog with all built-in components
export { defaultCatalog } from "./defaultCatalog";

// JSON Schema utilities
export {
	catalogToJsonSchema,
	catalogToUnifiedJsonSchema,
	entryToJsonSchema,
	type CatalogToJsonSchemaOptions,
} from "./toJsonSchema";

// Re-export all entry schemas and types for consumers who need them
export * from "./entries";
