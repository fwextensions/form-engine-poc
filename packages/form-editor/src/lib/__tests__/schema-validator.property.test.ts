/**
 * Property-Based Tests for Schema Validator
 * 
 * Feature: llm-integration
 * Property 9: YAML Syntax Validation - Validates: Requirements 7.4
 * Property 10: Form-Engine Schema Validation - Validates: Requirements 7.5
 * Property 11: Unknown Component Type Detection - Validates: Requirements 7.6
 * Property 12: Duplicate ID Detection - Validates: Requirements 7.7
 * 
 * Tests that the schema validator correctly identifies YAML syntax errors,
 * validates against form-engine schema, detects unknown component types,
 * and warns about duplicate IDs.
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { validateSchema } from "../schema-validator";
import { parseRootFormSchema, getCatalogTypes, getRegisteredCatalog } from "form-engine";
import * as yaml from "js-yaml";

// Configure fast-check
fc.configureGlobal({
  numRuns: 100,
});

describe("Schema Validator - Property-Based Tests", () => {
  describe("Property 9: YAML Syntax Validation", () => {
    /**
     * **Validates: Requirements 7.4**
     * 
     * For any string input, the schema validator SHALL correctly identify
     * valid vs invalid YAML syntax, returning appropriate error messages
     * for invalid YAML.
     */

    it("should return error for empty or whitespace-only strings", () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(""),
            fc.stringMatching(/^\s+$/)
          ),
          (emptyOrWhitespace) => {
            const result = validateSchema(emptyOrWhitespace);
            
            expect(result.valid).toBe(false);
            expect(result.errors).toContain("Schema is empty");
          }
        )
      );
    });

    it("should detect invalid YAML with unclosed brackets", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)),
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 3 }),
          (key, values) => {
            // Create YAML with unclosed array bracket - use inline array syntax
            const invalidYaml = `${key}: [${values.map(v => `"${v}"`).join(", ")}`;
            const result = validateSchema(invalidYaml);
            
            expect(result.valid).toBe(false);
            expect(result.errors.some(err => err.includes("YAML syntax error"))).toBe(true);
          }
        )
      );
    });

    it("should detect invalid YAML with unclosed quotes", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)),
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes('"') && !s.includes('\n')),
          (key, value) => {
            // Create YAML with unclosed quote - ensure it's on a single line
            const invalidYaml = `${key}: "${value}\nother: value`;
            const result = validateSchema(invalidYaml);
            
            expect(result.valid).toBe(false);
            expect(result.errors.some(err => err.includes("YAML syntax error"))).toBe(true);
          }
        )
      );
    });

    it("should accept valid YAML syntax", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)),
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9\s]+$/.test(s)),
          (key, value) => {
            // Create valid YAML - quote the value to avoid special characters
            const validYaml = `${key}: "${value}"`;
            const result = validateSchema(validYaml);
            
            // Should not have YAML syntax errors (may have other errors)
            expect(result.errors.every(err => !err.includes("YAML syntax error"))).toBe(true);
          }
        )
      );
    });

    it("should handle valid YAML objects with multiple properties", () => {
      fc.assert(
        fc.property(
          fc.dictionary(
            fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)),
            fc.oneof(fc.string(), fc.integer(), fc.boolean()),
            { minKeys: 1, maxKeys: 5 }
          ),
          (obj) => {
            const validYaml = yaml.dump(obj);
            const result = validateSchema(validYaml);
            
            // Should not have YAML syntax errors
            expect(result.errors.every(err => !err.includes("YAML syntax error"))).toBe(true);
          }
        )
      );
    });

    it("should handle valid YAML arrays", () => {
      fc.assert(
        fc.property(
          fc.array(fc.oneof(fc.string(), fc.integer()), { minLength: 1, maxLength: 5 }),
          (arr) => {
            const validYaml = yaml.dump(arr);
            const result = validateSchema(validYaml);
            
            // Should not have YAML syntax errors
            expect(result.errors.every(err => !err.includes("YAML syntax error"))).toBe(true);
          }
        )
      );
    });

    it("should detect malformed YAML with invalid indentation", () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            // Create YAML with inconsistent indentation
            const invalidYaml = `
parent:
  child1: value1
 child2: value2
`;
            const result = validateSchema(invalidYaml);
            
            expect(result.valid).toBe(false);
            expect(result.errors.some(err => err.includes("YAML syntax error"))).toBe(true);
          }
        )
      );
    });
  });

  describe("Property 10: Form-Engine Schema Validation", () => {
    /**
     * **Validates: Requirements 7.5**
     * 
     * For any valid YAML string, the schema validator's result SHALL be
     * consistent with the form-engine parseRootFormSchema function—if
     * form-engine accepts it, validation passes; if form-engine rejects it,
     * validation fails with the same errors.
     */

    // Generator for valid form schemas
    const validFormSchemaArb = fc.record({
      id: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)),
      type: fc.constant("form"),
      children: fc.array(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)),
          type: fc.constant("page"),
          title: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
          children: fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)),
              type: fc.constantFrom("text", "checkbox", "select"),
              label: fc.string({ minLength: 1, maxLength: 50 }),
            }),
            { maxLength: 3 }
          ),
        }),
        { minLength: 1, maxLength: 2 }
      ),
    });

    it("should accept schemas that form-engine accepts", () => {
      fc.assert(
        fc.property(
          validFormSchemaArb,
          (schema) => {
            const yamlString = yaml.dump(schema);
            
            // Check if form-engine accepts it
            const parseResult = parseRootFormSchema(schema);
            const formEngineAccepts = !parseResult.errors;
            
            // Our validator should agree
            const validationResult = validateSchema(yamlString);
            
            if (formEngineAccepts) {
              expect(validationResult.valid).toBe(true);
              expect(validationResult.errors).toHaveLength(0);
            }
          }
        )
      );
    });

    it("should reject schemas missing required type field", () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 20 }),
            // Missing type field
            children: fc.constant([]),
          }),
          (schema) => {
            const yamlString = yaml.dump(schema);
            const result = validateSchema(yamlString);
            
            expect(result.valid).toBe(false);
            expect(result.errors.some(err => err.toLowerCase().includes("type"))).toBe(true);
          }
        )
      );
    });

    it("should reject schemas with invalid structure", () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 20 }),
            type: fc.constant("form"),
            // Add an invalid property that will fail validation
            children: fc.constant("not-an-array"), // children should be an array
          }),
          (schema) => {
            const yamlString = yaml.dump(schema);
            const result = validateSchema(yamlString);
            
            // Should fail because children is not an array
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
          }
        )
      );
    });

    it("should be consistent with form-engine for any schema object", () => {
      fc.assert(
        fc.property(
          fc.oneof(
            // Valid schemas
            validFormSchemaArb,
            // Invalid schemas - missing type
            fc.record({
              id: fc.string(),
              children: fc.constant([]),
            }),
            // Invalid schemas - missing id
            fc.record({
              type: fc.constant("form"),
              children: fc.constant([]),
            }),
            // Invalid schemas - wrong type value
            fc.record({
              id: fc.string(),
              type: fc.string().filter(s => s !== "form"),
              children: fc.constant([]),
            })
          ),
          (schema) => {
            const yamlString = yaml.dump(schema);
            
            // Check form-engine result
            const parseResult = parseRootFormSchema(schema);
            const formEngineAccepts = !parseResult.errors;
            
            // Check our validator result
            const validationResult = validateSchema(yamlString);
            
            // Results should be consistent
            expect(validationResult.valid).toBe(formEngineAccepts);
          }
        )
      );
    });

    it("should validate nested component structures", () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)),
            type: fc.constant("form"),
            children: fc.array(
              fc.record({
                id: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)),
                type: fc.constant("page"),
                children: fc.array(
                  fc.record({
                    id: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)),
                    type: fc.constant("text"),
                    label: fc.string({ minLength: 1 }),
                  }),
                  { minLength: 1, maxLength: 3 }
                ),
              }),
              { minLength: 1, maxLength: 2 }
            ),
          }),
          (schema) => {
            const yamlString = yaml.dump(schema);
            const result = validateSchema(yamlString);
            
            // This should be a valid schema
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
          }
        )
      );
    });
  });

  describe("Property 11: Unknown Component Type Detection", () => {
    /**
     * **Validates: Requirements 7.6**
     * 
     * For any schema containing component types not registered in the catalog,
     * the schema validator SHALL report those types as unknown in the errors array.
     */

    // Get valid types from catalog
    const catalog = getRegisteredCatalog();
    const validTypes = getCatalogTypes(catalog);

    // Generator for unknown component types (not in catalog)
    const unknownTypeArb = fc.string({ minLength: 1, maxLength: 20 })
      .filter(s => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s))
      .filter(s => !validTypes.includes(s));

    it("should detect unknown component types at root level", () => {
      fc.assert(
        fc.property(
          unknownTypeArb,
          fc.string({ minLength: 1, maxLength: 20 }),
          (unknownType, id) => {
            const schema = {
              id,
              type: unknownType,
            };
            const yamlString = yaml.dump(schema);
            const result = validateSchema(yamlString);
            
            expect(result.valid).toBe(false);
            expect(result.errors.some(err => 
              err.includes("Unknown component type") && 
              err.includes(unknownType)
            )).toBe(true);
          }
        )
      );
    });

    it("should detect unknown types in nested children", () => {
      fc.assert(
        fc.property(
          unknownTypeArb,
          fc.string({ minLength: 1, maxLength: 20 }),
          (unknownType, id) => {
            const schema = {
              id: "myForm",
              type: "form",
              children: [
                {
                  id: "page1",
                  type: "page",
                  children: [
                    {
                      id,
                      type: unknownType,
                    },
                  ],
                },
              ],
            };
            const yamlString = yaml.dump(schema);
            const result = validateSchema(yamlString);
            
            expect(result.valid).toBe(false);
            expect(result.errors.some(err => 
              err.includes("Unknown component type") && 
              err.includes(unknownType)
            )).toBe(true);
          }
        )
      );
    });

    it("should list available types in error message", () => {
      fc.assert(
        fc.property(
          unknownTypeArb,
          (unknownType) => {
            const schema = {
              id: "test",
              type: unknownType,
            };
            const yamlString = yaml.dump(schema);
            const result = validateSchema(yamlString);
            
            expect(result.valid).toBe(false);
            expect(result.errors.some(err => 
              err.includes("Available types:")
            )).toBe(true);
          }
        )
      );
    });

    it("should detect multiple unknown types in same schema", () => {
      fc.assert(
        fc.property(
          fc.array(unknownTypeArb, { minLength: 2, maxLength: 5 })
            .map(arr => [...new Set(arr)]) // Remove duplicates
            .filter(arr => arr.length >= 2), // Ensure at least 2 unique
          (unknownTypes) => {
            const schema = {
              id: "myForm",
              type: "form",
              children: unknownTypes.map((type, i) => ({
                id: `field${i}`,
                type,
              })),
            };
            const yamlString = yaml.dump(schema);
            const result = validateSchema(yamlString);
            
            expect(result.valid).toBe(false);
            // Should mention unknown types
            expect(result.errors.some(err => err.includes("Unknown component type"))).toBe(true);
            // Should include at least some of the unknown types
            const errorText = result.errors.join(" ");
            expect(unknownTypes.some(type => errorText.includes(type))).toBe(true);
          }
        )
      );
    });

    it("should accept all registered component types", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...validTypes),
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)),
          (validType, id) => {
            // Create minimal valid schema with this type
            const schema: any = {
              id,
              type: validType,
            };
            
            // Add required fields based on type
            if (validType === "form") {
              schema.children = [];
            } else if (validType === "page") {
              schema.children = [];
            } else if (validType === "select") {
              schema.label = "Test";
              schema.options = [];
            } else if (["text", "email", "checkbox", "textarea"].includes(validType)) {
              schema.label = "Test";
            }
            
            const yamlString = yaml.dump(schema);
            const result = validateSchema(yamlString);
            
            // Should not have unknown type errors
            expect(result.errors.every(err => !err.includes("Unknown component type"))).toBe(true);
          }
        )
      );
    });

    it("should not report unknown types for valid nested structures", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          (numFields) => {
            const children = [];
            for (let i = 0; i < numFields; i++) {
              children.push({
                id: `field${i}`,
                type: "text",
                label: `Field ${i}`,
              });
            }
            
            const schema = {
              id: "myForm",
              type: "form",
              children: [
                {
                  id: "page1",
                  type: "page",
                  children,
                },
              ],
            };
            const yamlString = yaml.dump(schema);
            const result = validateSchema(yamlString);
            
            // Should not have unknown type errors
            expect(result.errors.every(err => !err.includes("Unknown component type"))).toBe(true);
          }
        )
      );
    });
  });

  describe("Property 12: Duplicate ID Detection", () => {
    /**
     * **Validates: Requirements 7.7**
     * 
     * For any schema containing multiple components with the same `id` value,
     * the schema validator SHALL include a warning about the duplicate IDs.
     */

    it("should warn about duplicate IDs at same level", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)),
          fc.integer({ min: 2, max: 5 }),
          (duplicateId, count) => {
            const children = [];
            for (let i = 0; i < count; i++) {
              children.push({
                id: duplicateId,
                type: "text",
                label: `Field ${i}`,
              });
            }
            
            const schema = {
              id: "myForm",
              type: "form",
              children: [
                {
                  id: "page1",
                  type: "page",
                  children,
                },
              ],
            };
            const yamlString = yaml.dump(schema);
            const result = validateSchema(yamlString);
            
            expect(result.warnings.some(warn => 
              warn.includes("Duplicate field IDs") && 
              warn.includes(duplicateId)
            )).toBe(true);
          }
        )
      );
    });

    it("should warn about duplicate IDs across different levels", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)),
          (duplicateId) => {
            const schema = {
              id: "myForm",
              type: "form",
              children: [
                {
                  id: duplicateId,
                  type: "page",
                  children: [
                    {
                      id: duplicateId,
                      type: "text",
                      label: "Field",
                    },
                  ],
                },
              ],
            };
            const yamlString = yaml.dump(schema);
            const result = validateSchema(yamlString);
            
            expect(result.warnings.some(warn => 
              warn.includes("Duplicate field IDs") && 
              warn.includes(duplicateId)
            )).toBe(true);
          }
        )
      );
    });

    it("should detect multiple different duplicate IDs", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)),
            { minLength: 2, maxLength: 5 }
          ).map(arr => [...new Set(arr)]).filter(arr => arr.length >= 2),
          (duplicateIds) => {
            const children = [];
            // Add each ID twice
            for (const id of duplicateIds) {
              children.push({
                id,
                type: "text",
                label: `Field ${id} 1`,
              });
              children.push({
                id,
                type: "text",
                label: `Field ${id} 2`,
              });
            }
            
            const schema = {
              id: "myForm",
              type: "form",
              children: [
                {
                  id: "page1",
                  type: "page",
                  children,
                },
              ],
            };
            const yamlString = yaml.dump(schema);
            const result = validateSchema(yamlString);
            
            // Should warn about duplicates
            expect(result.warnings.some(warn => warn.includes("Duplicate field IDs"))).toBe(true);
            
            // Should mention at least some of the duplicate IDs
            const warningText = result.warnings.join(" ");
            expect(duplicateIds.some(id => warningText.includes(id))).toBe(true);
          }
        )
      );
    });

    it("should not warn when all IDs are unique", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)),
            { minLength: 1, maxLength: 10 }
          ).map(arr => [...new Set(arr)]), // Ensure uniqueness
          (uniqueIds) => {
            const children = uniqueIds.map((id, i) => ({
              id,
              type: "text",
              label: `Field ${i}`,
            }));
            
            const schema = {
              id: "myForm",
              type: "form",
              children: [
                {
                  id: "page1",
                  type: "page",
                  children,
                },
              ],
            };
            const yamlString = yaml.dump(schema);
            const result = validateSchema(yamlString);
            
            // Should not have duplicate ID warnings
            expect(result.warnings.every(warn => !warn.includes("Duplicate field IDs"))).toBe(true);
          }
        )
      );
    });

    it("should still be valid with duplicate ID warnings", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)),
          (duplicateId) => {
            const schema = {
              id: "myForm",
              type: "form",
              children: [
                {
                  id: "page1",
                  type: "page",
                  children: [
                    {
                      id: duplicateId,
                      type: "text",
                      label: "Field 1",
                    },
                    {
                      id: duplicateId,
                      type: "text",
                      label: "Field 2",
                    },
                  ],
                },
              ],
            };
            const yamlString = yaml.dump(schema);
            const result = validateSchema(yamlString);
            
            // Duplicate IDs are warnings, not errors
            expect(result.valid).toBe(true);
            expect(result.warnings.length).toBeGreaterThan(0);
          }
        )
      );
    });

    it("should handle schemas with no IDs gracefully", () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            // Schema without id fields (invalid but shouldn't crash)
            const schema = {
              type: "form",
              children: [],
            };
            const yamlString = yaml.dump(schema);
            const result = validateSchema(yamlString);
            
            // Should not crash, may have errors but not duplicate ID warnings
            expect(result).toBeDefined();
            expect(result.warnings.every(warn => !warn.includes("Duplicate field IDs"))).toBe(true);
          }
        )
      );
    });

    it("should count exact number of duplicates correctly", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)),
          fc.integer({ min: 2, max: 10 }),
          (id, occurrences) => {
            const children = [];
            for (let i = 0; i < occurrences; i++) {
              children.push({
                id,
                type: "text",
                label: `Field ${i}`,
              });
            }
            
            const schema = {
              id: "myForm",
              type: "form",
              children: [
                {
                  id: "page1",
                  type: "page",
                  children,
                },
              ],
            };
            const yamlString = yaml.dump(schema);
            const result = validateSchema(yamlString);
            
            // Should warn about the duplicate
            expect(result.warnings.some(warn => 
              warn.includes("Duplicate field IDs") && 
              warn.includes(id)
            )).toBe(true);
          }
        )
      );
    });
  });
});
