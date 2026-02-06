/**
 * Unit tests for Schema Generator
 * 
 * Tests the SchemaGenerator class including system prompt construction
 * and edit prompt formatting.
 */

import { describe, it, expect } from "vitest";
import { SchemaGenerator } from "../schema-generator";

describe("SchemaGenerator", () => {
	describe("constructor", () => {
		it("should initialize successfully", () => {
			const generator = new SchemaGenerator();
			
			expect(generator).toBeDefined();
		});

		it("should generate catalog prompt during initialization", () => {
			const generator = new SchemaGenerator();
			
			// The generator should be ready to use immediately
			expect(generator).toBeDefined();
			
			// Should be able to get system prompt
			const systemPrompt = generator.getSystemPrompt();
			expect(systemPrompt).toBeDefined();
			expect(typeof systemPrompt).toBe("string");
		});
	});

	describe("getSystemPrompt", () => {
		it("should return catalog documentation", () => {
			const generator = new SchemaGenerator();
			const systemPrompt = generator.getSystemPrompt();
			
			expect(systemPrompt).toBeDefined();
			expect(typeof systemPrompt).toBe("string");
			expect(systemPrompt.length).toBeGreaterThan(0);
		});

		it("should include catalog documentation sections", () => {
			const generator = new SchemaGenerator();
			const systemPrompt = generator.getSystemPrompt();
			
			// Should contain key sections from catalog prompt
			expect(systemPrompt).toContain("Form Engine");
			expect(systemPrompt).toContain("Available Components");
			expect(systemPrompt).toContain("Schema Structure Rules");
			expect(systemPrompt).toContain("Conditional Logic");
			expect(systemPrompt).toContain("Validation Rules");
		});

		it("should include component examples", () => {
			const generator = new SchemaGenerator();
			const systemPrompt = generator.getSystemPrompt();
			
			// Should include examples (includeExamples: true in constructor)
			expect(systemPrompt).toContain("Example:");
		});

		it("should return the same prompt on multiple calls", () => {
			const generator = new SchemaGenerator();
			const prompt1 = generator.getSystemPrompt();
			const prompt2 = generator.getSystemPrompt();
			
			expect(prompt1).toBe(prompt2);
		});
	});

	describe("buildEditPrompt", () => {
		it("should include current schema in prompt", () => {
			const generator = new SchemaGenerator();
			const currentSchema = "type: form\nid: myForm";
			const instructions = "Add a text field";
			
			const prompt = generator.buildEditPrompt(currentSchema, instructions);
			
			expect(prompt).toContain(currentSchema);
			expect(prompt).toContain(instructions);
		});

		it("should format schema in code block", () => {
			const generator = new SchemaGenerator();
			const currentSchema = "type: form\nid: testForm";
			const instructions = "Change the ID";
			
			const prompt = generator.buildEditPrompt(currentSchema, instructions);
			
			expect(prompt).toContain("```yaml");
			expect(prompt).toContain(currentSchema);
			expect(prompt).toContain("```");
		});

		it("should request complete schema output", () => {
			const generator = new SchemaGenerator();
			const prompt = generator.buildEditPrompt("type: form", "Edit it");
			
			// Should instruct to output complete schema
			expect(prompt.toLowerCase()).toContain("complete");
		});

		it("should include instructions in prompt", () => {
			const generator = new SchemaGenerator();
			const instructions = "Add a checkbox for newsletter subscription";
			
			const prompt = generator.buildEditPrompt("type: form", instructions);
			
			expect(prompt).toContain(instructions);
		});

		it("should handle multi-line schemas", () => {
			const generator = new SchemaGenerator();
			const currentSchema = `type: form
id: contactForm
children:
  - type: text
    id: name
    label: Name`;
			const instructions = "Add email field";
			
			const prompt = generator.buildEditPrompt(currentSchema, instructions);
			
			expect(prompt).toContain(currentSchema);
			expect(prompt).toContain(instructions);
		});
	});
});
