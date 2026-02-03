// packages/form-engine/scripts/test-catalog-prompt-detailed.ts
// Detailed test to show the full output of generateCatalogPrompt

// Import all components to ensure they're registered
import "../src/components";
import { getRegisteredCatalog } from "../src/core/componentFactory";
import { generateCatalogPrompt, formatPropsFromZodSchema } from "../src/catalog/prompt";
import * as fs from "fs";
import * as path from "path";

console.log("=== Generating Full Catalog Prompt ===\n");

// Get the registered catalog
const catalog = getRegisteredCatalog();

// Generate the full prompt with examples
const fullPrompt = generateCatalogPrompt(catalog, { includeExamples: true });

// Write to a file for inspection
const outputPath = path.join(__dirname, "../dist/catalog-prompt-sample.md");
fs.writeFileSync(outputPath, fullPrompt);

console.log(`Full prompt written to: ${outputPath}`);
console.log(`Total length: ${fullPrompt.length} characters`);
console.log(`Total lines: ${fullPrompt.split("\n").length}`);
console.log();

// Test formatPropsFromZodSchema with a specific component
console.log("=== Testing formatPropsFromZodSchema ===\n");

const textEntry = catalog.components["text"];
if (textEntry) {
	console.log("Text component properties:");
	console.log("==========================");
	const props = formatPropsFromZodSchema(textEntry.schema);
	console.log(props);
	console.log();
}

const selectEntry = catalog.components["select"];
if (selectEntry) {
	console.log("Select component properties:");
	console.log("============================");
	const props = formatPropsFromZodSchema(selectEntry.schema);
	console.log(props);
	console.log();
}

console.log("=== Test completed! ===");
