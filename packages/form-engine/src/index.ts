// Core components and utilities for the new component-driven architecture
export { DynamicRenderer } from "./core/DynamicRenderer"; 
export type { FormEngineContext } from "./core/componentFactory"; // FormEngineContext is a type
export { FormEngineContextObject } from "./core/componentFactory"; // Export the actual React Context object
export {
	createComponent, 
} from "./core/componentFactory";
export {
	getComponentDefinition,
	getAllComponentDefinitions,
} from "./core/componentRegistryService"; // These are correctly re-exported by componentRegistryService

// Export specific component config types that might be useful for consumers
export type { FormConfig } from "./components/layout/Form";

// New schema parser for the component-driven architecture
export { parseRootFormSchema } from "./services/schemaParser";

// --- Existing Exports (to be reviewed/removed later if appropriate) --- //

// Main Form Component (Old)
//export { default as SchemaForm } from "./components/SchemaForm";

// Schema Parsing (Old)
export { parseFormSchema } from "./services/schemaParser";

// Schema Types (Old)
export type {
	FormSchema,
	FormField,
	FieldValidation,
	FormFieldOption,
} from "./services/schemaParser";
