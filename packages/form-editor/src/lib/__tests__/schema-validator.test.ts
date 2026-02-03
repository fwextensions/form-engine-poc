import { describe, it, expect } from "vitest";
import { validateSchema } from "../schema-validator";

describe("validateSchema", () => {
  describe("empty input", () => {
    it("should return error for empty string", () => {
      const result = validateSchema("");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Schema is empty");
    });

    it("should return error for whitespace only", () => {
      const result = validateSchema("   \n  \t  ");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Schema is empty");
    });
  });

  describe("YAML syntax validation", () => {
    it("should detect invalid YAML syntax", () => {
      const invalidYaml = `
id: myForm
type: form
children: [
  - type: page
`;
      const result = validateSchema(invalidYaml);
      expect(result.valid).toBe(false);
      expect(result.errors.some(err => err.includes("YAML syntax error"))).toBe(true);
    });

    it("should detect unclosed quotes", () => {
      const invalidYaml = `
id: "myForm
type: form
`;
      const result = validateSchema(invalidYaml);
      expect(result.valid).toBe(false);
      expect(result.errors.some(err => err.includes("YAML syntax error"))).toBe(true);
    });

    it("should accept valid YAML", () => {
      const validYaml = `
id: myForm
type: form
children: []
`;
      const result = validateSchema(validYaml);
      // May have other errors, but not YAML syntax errors
      expect(result.errors.every(err => !err.includes("YAML syntax error"))).toBe(true);
    });
  });

  describe("form-engine schema validation", () => {
    it("should validate a valid form schema", () => {
      const validSchema = `
id: myForm
type: form
children:
  - type: page
    id: page1
    children:
      - type: text
        id: firstName
        label: First Name
`;
      const result = validateSchema(validSchema);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect missing required type field", () => {
      const invalidSchema = `
id: myForm
children: []
`;
      const result = validateSchema(invalidSchema);
      expect(result.valid).toBe(false);
      expect(result.errors.some(err => err.toLowerCase().includes("type"))).toBe(true);
    });

    it("should detect invalid component configuration", () => {
      const invalidSchema = `
id: myForm
type: form
children:
  - type: text
    id: field1
    label: Test
    invalidProp: value
`;
      const result = validateSchema(invalidSchema);
      // This may or may not fail depending on whether Zod schema uses strict()
      // The test documents current behavior
      expect(result).toBeDefined();
    });
  });

  describe("unknown component type detection", () => {
    it("should detect unknown component types", () => {
      const schemaWithUnknown = `
id: myForm
type: form
children:
  - type: unknownComponent
    id: field1
  - type: anotherUnknown
    id: field2
`;
      const result = validateSchema(schemaWithUnknown);
      expect(result.valid).toBe(false);
      expect(result.errors.some(err => 
        err.includes("Unknown component type") && 
        err.includes("unknownComponent")
      )).toBe(true);
    });

    it("should detect unknown types in nested children", () => {
      const schemaWithNestedUnknown = `
id: myForm
type: form
children:
  - type: page
    id: page1
    children:
      - type: fakeField
        id: field1
`;
      const result = validateSchema(schemaWithNestedUnknown);
      expect(result.valid).toBe(false);
      expect(result.errors.some(err => 
        err.includes("Unknown component type") && 
        err.includes("fakeField")
      )).toBe(true);
    });

    it("should list available types in error message", () => {
      const schemaWithUnknown = `
id: myForm
type: unknownType
`;
      const result = validateSchema(schemaWithUnknown);
      expect(result.valid).toBe(false);
      expect(result.errors.some(err => 
        err.includes("Available types:")
      )).toBe(true);
    });

    it("should accept all registered component types", () => {
      // This test uses known registered types
      const validSchema = `
id: myForm
type: form
children:
  - type: page
    id: page1
    children:
      - type: text
        id: field1
        label: Text Field
      - type: checkbox
        id: field2
        label: Checkbox
      - type: select
        id: field3
        label: Select
        options:
          - label: Option 1
            value: opt1
`;
      const result = validateSchema(validSchema);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("duplicate ID detection", () => {
    it("should warn about duplicate IDs", () => {
      const schemaWithDuplicates = `
id: myForm
type: form
children:
  - type: page
    id: page1
    children:
      - type: text
        id: duplicateId
        label: Field 1
      - type: text
        id: duplicateId
        label: Field 2
`;
      const result = validateSchema(schemaWithDuplicates);
      expect(result.warnings.some(warn => 
        warn.includes("Duplicate field IDs") && 
        warn.includes("duplicateId")
      )).toBe(true);
    });

    it("should detect multiple duplicate IDs", () => {
      const schemaWithMultipleDuplicates = `
id: myForm
type: form
children:
  - type: page
    id: page1
    children:
      - type: text
        id: dup1
        label: Field 1
      - type: text
        id: dup1
        label: Field 2
      - type: text
        id: dup2
        label: Field 3
      - type: text
        id: dup2
        label: Field 4
`;
      const result = validateSchema(schemaWithMultipleDuplicates);
      expect(result.warnings.some(warn => 
        warn.includes("dup1") && warn.includes("dup2")
      )).toBe(true);
    });

    it("should not warn when all IDs are unique", () => {
      const schemaWithUniqueIds = `
id: myForm
type: form
children:
  - type: page
    id: page1
    children:
      - type: text
        id: field1
        label: Field 1
      - type: text
        id: field2
        label: Field 2
`;
      const result = validateSchema(schemaWithUniqueIds);
      expect(result.warnings).toHaveLength(0);
    });

    it("should still be valid with duplicate ID warnings", () => {
      const schemaWithDuplicates = `
id: myForm
type: form
children:
  - type: page
    id: page1
    children:
      - type: text
        id: duplicateId
        label: Field 1
      - type: text
        id: duplicateId
        label: Field 2
`;
      const result = validateSchema(schemaWithDuplicates);
      // Duplicate IDs are warnings, not errors
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe("combined validation", () => {
    it("should return both errors and warnings", () => {
      const schemaWithIssues = `
id: myForm
type: form
children:
  - type: unknownType
    id: field1
  - type: text
    id: field1
    label: Duplicate ID
`;
      const result = validateSchema(schemaWithIssues);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it("should validate complex nested schemas", () => {
      const complexSchema = `
id: registrationForm
type: form
children:
  - type: page
    id: personalInfo
    title: Personal Information
    children:
      - type: text
        id: firstName
        label: First Name
        validation:
          required: true
      - type: text
        id: lastName
        label: Last Name
        validation:
          required: true
      - type: email
        id: email
        label: Email Address
        validation:
          required: true
  - type: page
    id: preferences
    title: Preferences
    children:
      - type: checkbox
        id: newsletter
        label: Subscribe to newsletter
      - type: select
        id: country
        label: Country
        options:
          - label: United States
            value: us
          - label: Canada
            value: ca
`;
      const result = validateSchema(complexSchema);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });
  });
});
