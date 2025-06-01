import * as fs from "fs";
import * as path from "path";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ZodFormSchema } from "../src/services/schemaParser";

console.log("Generating JSON schema from Zod types...");

const outputPath = path.resolve(__dirname, "../dist/form-schema.json");
const outputDir = path.dirname(outputPath);

if (!fs.existsSync(outputDir)) {
	fs.mkdirSync(outputDir, { recursive: true });
	console.log(`Created directory: ${outputDir}`);
}

const jsonSchema = zodToJsonSchema(ZodFormSchema, "FormSchema");

fs.writeFileSync(outputPath, JSON.stringify(jsonSchema, null, 2));

console.log(`JSON Schema successfully generated at: ${outputPath}`);
