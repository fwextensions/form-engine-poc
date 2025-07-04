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
export type { FormConfig } from "./components/layout/Form";
export type { PageConfig } from "./components/layout/Page";
export { createComponent, getComponentDefinition, getAllComponentDefinitions } from "./core/componentFactory";
export { parseRootFormSchema } from "./core/schemaParser";
