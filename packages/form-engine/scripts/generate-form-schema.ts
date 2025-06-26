import * as fs from "fs";
import * as path from "path";
import { z, ZodObject, ZodTypeAny } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { getAllComponentDefinitions } from "../src/core/componentFactory";

// Import all component definitions to ensure they are registered in the factory
import "../src/components/fields/Checkbox";
import "../src/components/fields/DatePicker";
import "../src/components/fields/File";
import "../src/components/fields/RadioGroup";
import "../src/components/fields/Select";
import "../src/components/fields/Text";
import "../src/components/fields/Textarea";
import "../src/components/layout/Html";
import "../src/components/layout/Page";

console.log("Generating JSON schema from Zod types...");

// Get all registered component schemas from the factory
const componentDefinitions = getAllComponentDefinitions();
const componentSchemas = Array.from(componentDefinitions.values()).map(def => def.schema);

if (componentSchemas.length === 0) {
	throw new Error("No component schemas found. Make sure all components are imported.");
}

// Define a base interface for recursive components.
// This helps TypeScript understand the recursive structure without creating a circular type alias.
interface ComponentConfig {
	children?: ComponentConfig[];
	[key: string]: any;
}

// Create a lazy-loaded schema that will eventually resolve to the union of all component schemas.
// This is the key to handling recursion: `baseComponentSchema` can be used inside the definition
// of the schemas that will eventually form the union it resolves to.
const baseComponentSchema: z.ZodType<ComponentConfig> = z.lazy(() =>
	z.union(finalComponentSchemas as [ZodTypeAny, ZodTypeAny, ...ZodTypeAny[]])
);

// Iterate over the original component schemas and update any that have a `children` property
// to use our recursive `baseComponentSchema`.
const finalComponentSchemas = componentSchemas.map(schema => {
	// Use `instanceof` to check if the schema is a ZodObject, which has a `.shape` property.
	if (schema instanceof ZodObject && 'children' in schema.shape) {
		// `extend` creates a new schema, overriding the `children` property with the recursive one.
		return schema.extend({
			children: z.array(baseComponentSchema).optional(),
		});
	}
	return schema;
});

// Define the top-level form schema
const formSchema = z.object({
	id: z.string().min(1),
	title: z.string().min(1),
	type: z.literal('form'),
	// The form's children must be an array of our valid, recursive components.
	children: z.array(baseComponentSchema).min(1),
});

const outputPath = path.resolve(__dirname, "../dist/form-schema.json");
const outputDir = path.dirname(outputPath);

if (!fs.existsSync(outputDir)) {
	fs.mkdirSync(outputDir, { recursive: true });
	console.log(`Created directory: ${outputDir}`);
}

const jsonSchema = zodToJsonSchema(formSchema, "FormSchema");

fs.writeFileSync(outputPath, JSON.stringify(jsonSchema, null, 2));

console.log(`JSON Schema successfully generated at: ${outputPath}`);
