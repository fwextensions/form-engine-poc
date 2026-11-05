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
export {
	defineField,
	type DefineFieldArgs,
	type FieldControlArgs,
	type FieldInputProps,
} from "./core/defineField";
export {
	createComponent,
	getComponentDefinition,
	getAllComponentDefinitions,
	getComponentTypesByKind,
	type ComponentDefinition,
	type CreateComponentArgs,
	type ConfigCheck,
	type ConfigIssue,
} from "./core/componentFactory";
export { parseRootFormSchema, validateSchemaTree, type SchemaIssue, type ParseRootFormSchemaResult } from "./core/schemaParser";
export { baseValidationSchema, textValidationSchema, numberValidationSchema, ruleSchema, type Rule } from "./core/baseSchemas";

// Catalog exports - for schema validation, JSON Schema generation, and AI integration
export {
	// Core catalog functions and types
	createCatalog,
	getCatalogEntry,
	getCatalogTypes,
	getCatalogTypesByKind,
	getEntryKind,
	entryAllowsChildren,
	resolveAllowedChildren,
	type Catalog,
	type CatalogEntry,
	type ComponentKind,
	type ComponentMeta,
	type ChildrenSpec,
	type ValueSpec,
	// Auto-registered catalog - built automatically when components are imported
	getRegisteredCatalog,
	getRegisteredCatalogEntry,
	// JSON Schema utilities
	catalogToJsonSchema,
	catalogToUnifiedJsonSchema,
	catalogToFormJsonSchema,
	entryToJsonSchema,
	type CatalogToJsonSchemaOptions,
	type CatalogToFormJsonSchemaOptions,
	// LLM Prompt Generation utilities
	generateCatalogPrompt,
	generateComponentExample,
	formatPropsFromZodSchema,
	type CatalogPromptOptions,
} from "./catalog";
