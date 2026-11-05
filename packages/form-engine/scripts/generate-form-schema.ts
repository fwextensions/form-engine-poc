// Writes the registry-derived JSON Schema for whole form documents to
// dist/form-schema.json, for editors (VS Code YAML extension, Monaco) and
// external validators. The schema itself is built by catalogToFormJsonSchema().
import * as fs from "fs";
import * as path from "path";
import "../src/components";
import { getRegisteredCatalog } from "../src/core/componentFactory";
import { catalogToFormJsonSchema } from "../src/catalog/toJsonSchema";

const outputPath = path.resolve(__dirname, "../dist/form-schema.json");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });

const catalog = getRegisteredCatalog();
const jsonSchema = catalogToFormJsonSchema(catalog, { id: "https://form-engine.sf.gov/form-schema.json" });

fs.writeFileSync(outputPath, JSON.stringify(jsonSchema, null, 2));

console.log(`JSON Schema for ${Object.keys(catalog.components).length} component types written to ${outputPath}`);
