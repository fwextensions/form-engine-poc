// packages/form-engine/src/core/componentRegistryService.ts

// Option 1: Manual imports (triggers createComponent calls within each component file)
// These imports will be for component definition modules (e.g., .tsx files that call createComponent).
// They are commented out for now as the actual component files will be created/refactored in later steps.

// import "../components/fields/Text"; // e.g., imports Text.tsx
// import "../components/fields/Select";
// import "../components/layout/Page";
// import "../components/layout/Form";
// ... import all other component definition modules

// Option 2: Automated registration (see section VII of the spec)
// import "./autoRegister";

export { getComponentDefinition, getAllComponentDefinitions } from "./componentFactory";
