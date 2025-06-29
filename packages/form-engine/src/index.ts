// Core components and utilities for the new component-driven architecture
export { DynamicRenderer } from "./core/DynamicRenderer";
export { FormEngine, type FormEngineProps } from "./core/FormEngine";
export { createComponent } from "./core/componentFactory";
export { getComponentDefinition, getAllComponentDefinitions } from "./core/componentRegistryService";
export type { FormConfig } from "./components/layout/Form";
export { parseRootFormSchema } from "./services/schemaParser";
