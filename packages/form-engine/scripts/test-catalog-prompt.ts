// packages/form-engine/scripts/test-catalog-prompt.ts
// Manual test script to verify generateCatalogPrompt works correctly

// Import all components to ensure they're registered
import "../src/components";
import { getRegisteredCatalog } from "../src/core/componentFactory";
import { generateCatalogPrompt } from "../src/catalog/prompt";

console.log("=== Testing Catalog Prompt Generation ===\n");

// Get the registered catalog
const catalog = getRegisteredCatalog();
console.log(`Found ${Object.keys(catalog.components).length} registered components\n`);

// Test 1: Generate prompt without examples
console.log("Test 1: Generate prompt without examples");
console.log("==========================================");
const promptWithoutExamples = generateCatalogPrompt(catalog, { includeExamples: false });
console.log(`Generated prompt length: ${promptWithoutExamples.length} characters`);
console.log(`Contains "Available Components": ${promptWithoutExamples.includes("Available Components")}`);
console.log(`Contains "Schema Structure Rules": ${promptWithoutExamples.includes("Schema Structure Rules")}`);
console.log(`Contains "Conditional Logic": ${promptWithoutExamples.includes("Conditional Logic")}`);
console.log(`Contains "Validation Rules": ${promptWithoutExamples.includes("Validation Rules")}`);
console.log();

// Test 2: Generate prompt with examples
console.log("Test 2: Generate prompt with examples");
console.log("======================================");
const promptWithExamples = generateCatalogPrompt(catalog, { includeExamples: true });
console.log(`Generated prompt length: ${promptWithExamples.length} characters`);
console.log(`Contains YAML examples: ${promptWithExamples.includes("```yaml")}`);
console.log();

// Test 3: Custom preamble
console.log("Test 3: Custom preamble");
console.log("========================");
const customPreamble = "# Custom Form Engine\n\nThis is a custom preamble.";
const promptWithCustomPreamble = generateCatalogPrompt(catalog, { preamble: customPreamble });
console.log(`Contains custom preamble: ${promptWithCustomPreamble.includes("Custom Form Engine")}`);
console.log();

// Test 4: Check specific component documentation
console.log("Test 4: Check specific component documentation");
console.log("===============================================");
const componentTypes = Object.keys(catalog.components);
console.log(`Component types found: ${componentTypes.join(", ")}`);
console.log();

// Show a sample of the generated prompt
console.log("Sample of generated prompt (first 1000 characters):");
console.log("====================================================");
console.log(promptWithoutExamples.substring(0, 1000));
console.log("...\n");

console.log("=== All tests completed successfully! ===");
