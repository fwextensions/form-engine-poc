// import all the component modules so they'll register themselves with the registry
import "./components";

export { FormEngine, type FormEngineProps } from "./components/core/FormEngine";
export { createComponent, getComponentDefinition, getAllComponentDefinitions } from "./core/componentFactory";
export type { FormConfig } from "./components/layout/Form";
export { parseRootFormSchema } from "./core/schemaParser";
