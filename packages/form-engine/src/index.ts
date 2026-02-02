// import all the component modules so they'll register themselves and be
// available for rendering, but don't export them, as they're not intended for
// use outside the form engine
import "./components";

export { FormEngine } from "./engine/FormEngine";
export type {
	FormEngineHandle,
	FormMeta,
	FormEngineProps,
} from "./engine/FormEngine";
export { useFormMeta } from "./engine/useFormMeta";
export type { FormConfig } from "./components/layout/Form";
export type { PageConfig } from "./components/layout/Page";
export { createComponent, getComponentDefinition, getAllComponentDefinitions } from "./core/componentFactory";
export { parseRootFormSchema } from "./core/schemaParser";

// Catalog exports - for schema validation, JSON Schema generation, and AI integration
export {
	// Core catalog functions and types
	createCatalog,
	getCatalogEntry,
	getCatalogTypes,
	type Catalog,
	type CatalogEntry,
	// Default catalog with all built-in components
	defaultCatalog,
	// JSON Schema utilities
	catalogToJsonSchema,
	catalogToUnifiedJsonSchema,
	entryToJsonSchema,
	type CatalogToJsonSchemaOptions,
} from "./catalog";
