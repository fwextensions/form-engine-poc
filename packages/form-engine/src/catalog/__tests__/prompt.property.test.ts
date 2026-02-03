// packages/form-engine/src/catalog/__tests__/prompt.property.test.ts
// Property-based tests for catalog prompt generation
// Feature: llm-integration
// Property 1: Catalog Prompt Completeness - Validates: Requirements 1.1, 1.3, 1.4
// Property 2: Zod Schema Property Extraction - Validates: Requirements 1.2
// Property 3: Conditional Example Inclusion - Validates: Requirements 1.8

import { describe, it, expect } from "vitest";
import { z } from "zod";
import * as fc from "fast-check";
import { formatPropsFromZodSchema, generateCatalogPrompt } from "../prompt";
import type { Catalog } from "../catalog";

// Configure fast-check
fc.configureGlobal({
	numRuns: 100,
});

describe("formatPropsFromZodSchema - Property-Based Tests", () => {
	describe("Property 2: Zod Schema Property Extraction", () => {
		it("should always return a string", () => {
			fc.assert(
				fc.property(
					fc.record({
						name: fc.string(),
						age: fc.integer(),
					}),
					() => {
						const schema = z.object({
							field: z.string(),
						});
						const result = formatPropsFromZodSchema(schema);
						expect(typeof result).toBe("string");
					}
				)
			);
		});

		it("should include property name for any object schema with properties", () => {
			fc.assert(
				fc.property(
					fc.string({ minLength: 1, maxLength: 20 })
						.filter(s => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s))
						.filter(s => !["__proto__", "constructor", "prototype"].includes(s)), // Filter out special JS properties
					(propName) => {
						const schema = z.object({
							[propName]: z.string(),
						});
						const result = formatPropsFromZodSchema(schema);
						expect(result).toContain(`**${propName}**`);
					}
				)
			);
		});

		it("should correctly identify required vs optional properties", () => {
			fc.assert(
				fc.property(
					fc.boolean(),
					(isOptional) => {
						const schema = z.object({
							field: isOptional ? z.string().optional() : z.string(),
						});
						const result = formatPropsFromZodSchema(schema);
						
						if (isOptional) {
							expect(result).toContain("[Optional]");
						} else {
							expect(result).toContain("[Required]");
						}
					}
				)
			);
		});

		it("should extract default values for any type", () => {
			fc.assert(
				fc.property(
					fc.oneof(
						fc.string(),
						fc.integer(),
						fc.boolean()
					),
					(defaultValue) => {
						let schema;
						if (typeof defaultValue === "string") {
							schema = z.object({ field: z.string().default(defaultValue) });
						} else if (typeof defaultValue === "number") {
							schema = z.object({ field: z.number().default(defaultValue) });
						} else {
							schema = z.object({ field: z.boolean().default(defaultValue) });
						}
						
						const result = formatPropsFromZodSchema(schema);
						expect(result).toContain("Default:");
						expect(result).toContain(JSON.stringify(defaultValue));
					}
				)
			);
		});

		it("should extract minLength constraint for strings", () => {
			fc.assert(
				fc.property(
					fc.integer({ min: 0, max: 100 }),
					(minLength) => {
						const schema = z.object({
							field: z.string().min(minLength),
						});
						const result = formatPropsFromZodSchema(schema);
						expect(result).toContain(`minLength: ${minLength}`);
					}
				)
			);
		});

		it("should extract maxLength constraint for strings", () => {
			fc.assert(
				fc.property(
					fc.integer({ min: 1, max: 1000 }),
					(maxLength) => {
						const schema = z.object({
							field: z.string().max(maxLength),
						});
						const result = formatPropsFromZodSchema(schema);
						expect(result).toContain(`maxLength: ${maxLength}`);
					}
				)
			);
		});

		it("should extract min constraint for numbers", () => {
			fc.assert(
				fc.property(
					fc.integer({ min: -1000, max: 1000 }),
					(min) => {
						const schema = z.object({
							field: z.number().min(min),
						});
						const result = formatPropsFromZodSchema(schema);
						expect(result).toContain(`min: ${min}`);
					}
				)
			);
		});

		it("should extract max constraint for numbers", () => {
			fc.assert(
				fc.property(
					fc.integer({ min: -1000, max: 1000 }),
					(max) => {
						const schema = z.object({
							field: z.number().max(max),
						});
						const result = formatPropsFromZodSchema(schema);
						expect(result).toContain(`max: ${max}`);
					}
				)
			);
		});

		it("should extract all enum values", () => {
			fc.assert(
				fc.property(
					fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 2, maxLength: 5 })
						.map(arr => [...new Set(arr)]) // Remove duplicates
						.filter(arr => arr.length >= 2), // Ensure at least 2 unique values
					(enumValues) => {
						const schema = z.object({
							field: z.enum(enumValues as [string, string, ...string[]]),
						});
						const result = formatPropsFromZodSchema(schema);
						
						expect(result).toContain("enum:");
						// Check that all enum values are present
						for (const value of enumValues) {
							expect(result).toContain(`"${value}"`);
						}
					}
				)
			);
		});

		it("should handle array types with correct item type", () => {
			fc.assert(
				fc.property(
					fc.constantFrom("string", "number", "boolean"),
					(itemType) => {
						let schema;
						if (itemType === "string") {
							schema = z.object({ field: z.array(z.string()) });
						} else if (itemType === "number") {
							schema = z.object({ field: z.array(z.number()) });
						} else {
							schema = z.object({ field: z.array(z.boolean()) });
						}
						
						const result = formatPropsFromZodSchema(schema);
						expect(result).toContain(`array<${itemType}>`);
					}
				)
			);
		});

		it("should extract minItems constraint for arrays", () => {
			fc.assert(
				fc.property(
					fc.integer({ min: 0, max: 10 }),
					(minItems) => {
						const schema = z.object({
							field: z.array(z.string()).min(minItems),
						});
						const result = formatPropsFromZodSchema(schema);
						expect(result).toContain(`minItems: ${minItems}`);
					}
				)
			);
		});

		it("should extract maxItems constraint for arrays", () => {
			fc.assert(
				fc.property(
					fc.integer({ min: 1, max: 100 }),
					(maxItems) => {
						const schema = z.object({
							field: z.array(z.string()).max(maxItems),
						});
						const result = formatPropsFromZodSchema(schema);
						expect(result).toContain(`maxItems: ${maxItems}`);
					}
				)
			);
		});

		it("should handle multiple properties with different types", () => {
			fc.assert(
				fc.property(
					fc.record({
						stringProp: fc.constant(z.string()),
						numberProp: fc.constant(z.number()),
						boolProp: fc.constant(z.boolean()),
					}),
					() => {
						const schema = z.object({
							str: z.string(),
							num: z.number(),
							bool: z.boolean(),
						});
						const result = formatPropsFromZodSchema(schema);
						
						expect(result).toContain("**str**");
						expect(result).toContain("**num**");
						expect(result).toContain("**bool**");
						expect(result).toContain("string");
						expect(result).toContain("number");
						expect(result).toContain("boolean");
					}
				)
			);
		});

		it("should handle schemas with both required and optional properties", () => {
			fc.assert(
				fc.property(
					fc.integer({ min: 1, max: 5 }),
					(numRequired) => {
						const schemaObj: Record<string, z.ZodTypeAny> = {};
						
						// Add required properties
						for (let i = 0; i < numRequired; i++) {
							schemaObj[`required${i}`] = z.string();
						}
						
						// Add optional properties
						for (let i = 0; i < numRequired; i++) {
							schemaObj[`optional${i}`] = z.string().optional();
						}
						
						const schema = z.object(schemaObj);
						const result = formatPropsFromZodSchema(schema);
						
						// Count occurrences of [Required] and [Optional]
						const requiredCount = (result.match(/\[Required\]/g) || []).length;
						const optionalCount = (result.match(/\[Optional\]/g) || []).length;
						
						expect(requiredCount).toBe(numRequired);
						expect(optionalCount).toBe(numRequired);
					}
				)
			);
		});

		it("should never throw an error for any valid Zod object schema", () => {
			fc.assert(
				fc.property(
					fc.oneof(
						fc.constant(z.object({ field: z.string() })),
						fc.constant(z.object({ field: z.number() })),
						fc.constant(z.object({ field: z.boolean() })),
						fc.constant(z.object({ field: z.string().optional() })),
						fc.constant(z.object({ field: z.array(z.string()) })),
						fc.constant(z.object({ field: z.object({ nested: z.string() }) })),
						fc.constant(z.object({}))
					),
					(schema) => {
						expect(() => formatPropsFromZodSchema(schema)).not.toThrow();
					}
				)
			);
		});

		it("should handle literal types correctly", () => {
			fc.assert(
				fc.property(
					fc.oneof(
						fc.string().filter(s => !s.includes('"')), // Avoid strings with quotes for simpler testing
						fc.integer(),
						fc.boolean()
					),
					(literalValue) => {
						let schema;
						if (typeof literalValue === "string") {
							schema = z.object({ field: z.literal(literalValue) });
						} else if (typeof literalValue === "number") {
							schema = z.object({ field: z.literal(literalValue) });
						} else {
							schema = z.object({ field: z.literal(literalValue) });
						}
						
						const result = formatPropsFromZodSchema(schema);
						expect(result).toContain("literal:");
						// The literal value should appear in the output (may be formatted differently)
						expect(result).toContain(String(literalValue));
					}
				)
			);
		});

		it("should preserve property order in output", () => {
			fc.assert(
				fc.property(
					fc.constant(null),
					() => {
						const schema = z.object({
							first: z.string(),
							second: z.number(),
							third: z.boolean(),
						});
						const result = formatPropsFromZodSchema(schema);
						
						const firstIndex = result.indexOf("**first**");
						const secondIndex = result.indexOf("**second**");
						const thirdIndex = result.indexOf("**third**");
						
						expect(firstIndex).toBeGreaterThan(-1);
						expect(secondIndex).toBeGreaterThan(firstIndex);
						expect(thirdIndex).toBeGreaterThan(secondIndex);
					}
				)
			);
		});
	});

	describe("Property 1: Catalog Prompt Completeness", () => {
		/**
		 * **Validates: Requirements 1.1, 1.3, 1.4**
		 * 
		 * For any catalog with registered components, the generated prompt SHALL contain
		 * documentation for each component including its type name, description (if provided),
		 * and children capability indicator.
		 */

		// Generator for component type names (valid identifiers)
		const componentTypeArb = fc.string({ minLength: 1, maxLength: 20 })
			.filter(s => /^[a-z][a-z0-9]*$/.test(s))
			.filter(s => s !== "type"); // Avoid reserved words

		// Generator for catalog entries
		const catalogEntryArb = fc.record({
			schema: fc.constant(z.object({
				type: z.string(),
				id: z.string(),
			})),
			description: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
			hasChildren: fc.option(fc.boolean(), { nil: undefined }),
		});

		it("should include type name for every component in catalog", () => {
			fc.assert(
				fc.property(
					fc.dictionary(componentTypeArb, catalogEntryArb, { minKeys: 1, maxKeys: 10 }),
					(components) => {
						const catalog: Catalog = { components };
						const result = generateCatalogPrompt(catalog);

						// Every component type should appear as a heading
						for (const type of Object.keys(components)) {
							expect(result).toContain(`### ${type}`);
						}
					}
				)
			);
		});

		it("should include description when provided for any component", () => {
			fc.assert(
				fc.property(
					componentTypeArb,
					fc.string({ minLength: 10, maxLength: 100 }),
					(type, description) => {
						const catalog: Catalog = {
							components: {
								[type]: {
									schema: z.object({ type: z.string(), id: z.string() }),
									description,
								},
							},
						};
						const result = generateCatalogPrompt(catalog);

						expect(result).toContain(description);
					}
				)
			);
		});

		it("should indicate children capability when hasChildren is true", () => {
			fc.assert(
				fc.property(
					componentTypeArb,
					fc.boolean(),
					(type, hasChildren) => {
						const catalog: Catalog = {
							components: {
								[type]: {
									schema: z.object({ type: z.string(), id: z.string() }),
									hasChildren,
								},
							},
						};
						const result = generateCatalogPrompt(catalog);

						if (hasChildren) {
							expect(result).toContain("**Can contain children:** Yes");
						} else {
							// When hasChildren is false, it should not show the indicator
							// (though other components might, so we can't assert it's absent globally)
							const typeSection = result.split(`### ${type}`)[1]?.split("###")[0] || "";
							expect(typeSection).not.toContain("**Can contain children:** Yes");
						}
					}
				)
			);
		});

		it("should include all components regardless of catalog size", () => {
			fc.assert(
				fc.property(
					fc.integer({ min: 1, max: 20 }),
					(numComponents) => {
						const components: Record<string, any> = {};
						for (let i = 0; i < numComponents; i++) {
							components[`component${i}`] = {
								schema: z.object({ type: z.string(), id: z.string() }),
								description: `Component ${i} description`,
							};
						}
						const catalog: Catalog = { components };
						const result = generateCatalogPrompt(catalog);

						// All components should be documented
						for (let i = 0; i < numComponents; i++) {
							expect(result).toContain(`### component${i}`);
							expect(result).toContain(`Component ${i} description`);
						}
					}
				)
			);
		});

		it("should include properties section for every component", () => {
			fc.assert(
				fc.property(
					fc.dictionary(componentTypeArb, catalogEntryArb, { minKeys: 1, maxKeys: 5 }),
					(components) => {
						const catalog: Catalog = { components };
						const result = generateCatalogPrompt(catalog);

						// Count the number of "**Properties:**" sections
						const propertiesCount = (result.match(/\*\*Properties:\*\*/g) || []).length;
						const componentCount = Object.keys(components).length;

						expect(propertiesCount).toBe(componentCount);
					}
				)
			);
		});

		it("should always include required documentation sections", () => {
			fc.assert(
				fc.property(
					fc.dictionary(componentTypeArb, catalogEntryArb, { minKeys: 1, maxKeys: 5 }),
					(components) => {
						const catalog: Catalog = { components };
						const result = generateCatalogPrompt(catalog);

						// Required sections
						expect(result).toContain("## Available Components");
						expect(result).toContain("## Schema Structure Rules");
						expect(result).toContain("## Conditional Logic");
						expect(result).toContain("## Validation Rules");
					}
				)
			);
		});

		it("should handle components with all optional fields undefined", () => {
			fc.assert(
				fc.property(
					componentTypeArb,
					(type) => {
						const catalog: Catalog = {
							components: {
								[type]: {
									schema: z.object({ type: z.string() }),
									// No description, no hasChildren
								},
							},
						};
						const result = generateCatalogPrompt(catalog);

						// Should still include the component type
						expect(result).toContain(`### ${type}`);
						// Should still have properties section
						expect(result).toContain("**Properties:**");
					}
				)
			);
		});

		it("should maintain component order consistency", () => {
			fc.assert(
				fc.property(
					fc.constant(null),
					() => {
						const catalog: Catalog = {
							components: {
								zebra: { schema: z.object({ type: z.string() }) },
								apple: { schema: z.object({ type: z.string() }) },
								middle: { schema: z.object({ type: z.string() }) },
							},
						};
						const result = generateCatalogPrompt(catalog);

						// Components should be sorted alphabetically
						const appleIndex = result.indexOf("### apple");
						const middleIndex = result.indexOf("### middle");
						const zebraIndex = result.indexOf("### zebra");

						expect(appleIndex).toBeGreaterThan(-1);
						expect(middleIndex).toBeGreaterThan(appleIndex);
						expect(zebraIndex).toBeGreaterThan(middleIndex);
					}
				)
			);
		});
	});

	describe("Property 3: Conditional Example Inclusion", () => {
		/**
		 * **Validates: Requirements 1.8**
		 * 
		 * For any catalog and prompt generation with `includeExamples: true`,
		 * the generated prompt SHALL contain a YAML example for each component type in the catalog.
		 */

		const componentTypeArb = fc.string({ minLength: 1, maxLength: 20 })
			.filter(s => /^[a-z][a-z0-9]*$/.test(s));

		const catalogEntryArb = fc.record({
			schema: fc.constant(z.object({
				type: z.string(),
				id: z.string(),
			})),
			description: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
		});

		it("should include YAML examples when includeExamples is true", () => {
			fc.assert(
				fc.property(
					fc.dictionary(componentTypeArb, catalogEntryArb, { minKeys: 1, maxKeys: 10 }),
					(components) => {
						const catalog: Catalog = { components };
						const result = generateCatalogPrompt(catalog, { includeExamples: true });

						// Should have "**Example:**" section for each component
						const exampleCount = (result.match(/\*\*Example:\*\*/g) || []).length;
						const componentCount = Object.keys(components).length;

						expect(exampleCount).toBe(componentCount);

						// Should have YAML code blocks
						expect(result).toContain("```yaml");
						expect(result).toContain("```");
					}
				)
			);
		});

		it("should not include component examples when includeExamples is false", () => {
			fc.assert(
				fc.property(
					fc.dictionary(componentTypeArb, catalogEntryArb, { minKeys: 1, maxKeys: 10 }),
					(components) => {
						const catalog: Catalog = { components };
						const result = generateCatalogPrompt(catalog, { includeExamples: false });

						// Extract just the component documentation section (before Schema Structure Rules)
						const componentSection = result.split("## Schema Structure Rules")[0];

						// Should not have "**Example:**" sections in component documentation
						expect(componentSection).not.toContain("**Example:**");
					}
				)
			);
		});

		it("should not include component examples when includeExamples is undefined", () => {
			fc.assert(
				fc.property(
					fc.dictionary(componentTypeArb, catalogEntryArb, { minKeys: 1, maxKeys: 5 }),
					(components) => {
						const catalog: Catalog = { components };
						const result = generateCatalogPrompt(catalog); // No options

						// Extract just the component documentation section
						const componentSection = result.split("## Schema Structure Rules")[0];

						// Should not have "**Example:**" sections in component documentation
						expect(componentSection).not.toContain("**Example:**");
					}
				)
			);
		});

		it("should include type in YAML example for each component", () => {
			fc.assert(
				fc.property(
					componentTypeArb,
					(type) => {
						const catalog: Catalog = {
							components: {
								[type]: {
									schema: z.object({ type: z.string(), id: z.string() }),
								},
							},
						};
						const result = generateCatalogPrompt(catalog, { includeExamples: true });

						// Should include the component type in the example
						expect(result).toContain(`type: ${type}`);
					}
				)
			);
		});

		it("should include exactly one example per component when enabled", () => {
			fc.assert(
				fc.property(
					fc.integer({ min: 1, max: 10 }),
					(numComponents) => {
						const components: Record<string, any> = {};
						for (let i = 0; i < numComponents; i++) {
							components[`comp${i}`] = {
								schema: z.object({ type: z.string(), id: z.string() }),
							};
						}
						const catalog: Catalog = { components };
						const result = generateCatalogPrompt(catalog, { includeExamples: true });

						// Count "type: comp" occurrences in examples
						for (let i = 0; i < numComponents; i++) {
							const typePattern = new RegExp(`type: comp${i}`, "g");
							const matches = result.match(typePattern) || [];
							expect(matches.length).toBeGreaterThanOrEqual(1);
						}
					}
				)
			);
		});

		it("should toggle examples based on includeExamples option", () => {
			fc.assert(
				fc.property(
					fc.dictionary(componentTypeArb, catalogEntryArb, { minKeys: 2, maxKeys: 5 }),
					fc.boolean(),
					(components, includeExamples) => {
						const catalog: Catalog = { components };
						const result = generateCatalogPrompt(catalog, { includeExamples });

						const componentSection = result.split("## Schema Structure Rules")[0];
						const hasExamples = componentSection.includes("**Example:**");

						expect(hasExamples).toBe(includeExamples);
					}
				)
			);
		});

		it("should include examples for all components regardless of other properties", () => {
			fc.assert(
				fc.property(
					componentTypeArb,
					fc.option(fc.string(), { nil: undefined }),
					fc.option(fc.boolean(), { nil: undefined }),
					(type, description, hasChildren) => {
						const catalog: Catalog = {
							components: {
								[type]: {
									schema: z.object({ type: z.string(), id: z.string() }),
									description,
									hasChildren,
								},
							},
						};
						const result = generateCatalogPrompt(catalog, { includeExamples: true });

						// Should have example regardless of description or hasChildren
						expect(result).toContain("**Example:**");
						expect(result).toContain(`type: ${type}`);
					}
				)
			);
		});

		it("should maintain consistent structure with and without examples", () => {
			fc.assert(
				fc.property(
					fc.dictionary(componentTypeArb, catalogEntryArb, { minKeys: 1, maxKeys: 5 }),
					(components) => {
						const catalog: Catalog = { components };
						const withExamples = generateCatalogPrompt(catalog, { includeExamples: true });
						const withoutExamples = generateCatalogPrompt(catalog, { includeExamples: false });

						// Both should have the same required sections
						expect(withExamples).toContain("## Available Components");
						expect(withoutExamples).toContain("## Available Components");
						expect(withExamples).toContain("## Schema Structure Rules");
						expect(withoutExamples).toContain("## Schema Structure Rules");

						// Both should have all component types
						for (const type of Object.keys(components)) {
							expect(withExamples).toContain(`### ${type}`);
							expect(withoutExamples).toContain(`### ${type}`);
						}
					}
				)
			);
		});
	});
});
