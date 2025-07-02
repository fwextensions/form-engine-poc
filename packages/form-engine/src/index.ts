// import all the component modules so they'll register themselves and be
// available for rendering, but don't export them, as they're not intended for
// use outside the form engine
import "./components";

export { FormEngine, type FormEngineProps } from "./engine/FormEngine";
export { createComponent, getComponentDefinition, getAllComponentDefinitions } from "./core/componentFactory";
export type { FormConfig } from "./components/layout/Form";
export { parseRootFormSchema } from "./core/schemaParser";
