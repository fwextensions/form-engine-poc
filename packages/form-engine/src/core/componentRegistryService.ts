// Option 1: Manual imports (triggers createComponent calls within each component file)
// This index file imports all the component definition modules (e.g., .tsx files that call createComponent).

import "../components";

// Option 2: Automated registration (see section VII of the spec)
// import "./autoRegister";

export { getComponentDefinition, getAllComponentDefinitions } from "./componentFactory";
