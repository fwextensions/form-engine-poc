// packages/form-engine/src/catalog/__tests__/prompt.integration.test.ts
// Integration tests for generateCatalogPrompt with component documentation

import { describe, it, expect } from "vitest";
import { z } from "zod";
import { generateCatalogPrompt } from "../prompt";
import type { Catalog } from "../catalog";

describe("generateCatalogPrompt - Component Documentation", () => {
	it("should include component type in documentation", () => {
		const catalog: Catalog = {
			components: {
				text: {
					schema: z.object({
						type: z.literal("text"),
						id: z.string(),
						label: z.string().optional(),
					}),
					description: "A text input field",
				},
			},
		};

		const result = generateCatalogPrompt(catalog);

		expect(result).toContain("### text");
	});

	it("should include component description when provided", () => {
		const catalog: Catalog = {
			components: {
				text: {
					schema: z.object({
						type: z.literal("text"),
						id: z.string(),
					}),
					description: "A text input field for single-line text",
				},
			},
		};

		const result = generateCatalogPrompt(catalog);

		expect(result).toContain("A text input field for single-line text");
	});

	it("should indicate when component can contain children", () => {
		const catalog: Catalog = {
			components: {
				form: {
					schema: z.object({
						type: z.literal("form"),
						id: z.string(),
					}),
					description: "The root form container",
					hasChildren: true,
				},
			},
		};

		const result = generateCatalogPrompt(catalog);

		expect(result).toContain("**Can contain children:** Yes");
	});

	it("should not show children indicator when hasChildren is false or undefined", () => {
		const catalog: Catalog = {
			components: {
				text: {
					schema: z.object({
						type: z.literal("text"),
						id: z.string(),
					}),
					description: "A text input field",
					hasChildren: false,
				},
			},
		};

		const result = generateCatalogPrompt(catalog);

		expect(result).not.toContain("**Can contain children:**");
	});

	it("should format props from Zod schema", () => {
		const catalog: Catalog = {
			components: {
				text: {
					schema: z.object({
						type: z.literal("text"),
						id: z.string(),
						label: z.string().optional(),
						placeholder: z.string().optional(),
						defaultValue: z.string().default(""),
					}),
					description: "A text input field",
				},
			},
		};

		const result = generateCatalogPrompt(catalog);

		// Should include property names
		expect(result).toContain("**id**");
		expect(result).toContain("**label**");
		expect(result).toContain("**placeholder**");
		expect(result).toContain("**defaultValue**");

		// Should indicate required/optional
		expect(result).toMatch(/\*\*id\*\*.*\[Required\]/);
		expect(result).toMatch(/\*\*label\*\*.*\[Optional\]/);

		// Should show default value
		expect(result).toContain('Default: `""`');
	});

	it("should include YAML examples when includeExamples is true", () => {
		const catalog: Catalog = {
			components: {
				text: {
					schema: z.object({
						type: z.literal("text"),
						id: z.string(),
						label: z.string().optional(),
					}),
					description: "A text input field",
				},
			},
		};

		const result = generateCatalogPrompt(catalog, { includeExamples: true });

		expect(result).toContain("**Example:**");
		expect(result).toContain("```yaml");
		expect(result).toContain("type: text");
		expect(result).toContain("id: exampleText");
	});

	it("should not include YAML examples when includeExamples is false", () => {
		const catalog: Catalog = {
			components: {
				text: {
					schema: z.object({
						type: z.literal("text"),
						id: z.string(),
					}),
					description: "A text input field",
				},
			},
		};

		const result = generateCatalogPrompt(catalog, { includeExamples: false });

		// Should not include the Example section for components
		expect(result).not.toContain("**Example:**");
		// Should not include component-specific examples (like "type: text")
		// Note: The documentation sections still contain YAML examples for general usage
		const textComponentSection = result.split("## Schema Structure Rules")[0];
		expect(textComponentSection).not.toContain("type: text\nid: exampleText");
	});

	it("should format documentation for multiple components", () => {
		const catalog: Catalog = {
			components: {
				text: {
					schema: z.object({
						type: z.literal("text"),
						id: z.string(),
						label: z.string().optional(),
					}),
					description: "A text input field",
				},
				checkbox: {
					schema: z.object({
						type: z.literal("checkbox"),
						id: z.string(),
						label: z.string().optional(),
						defaultChecked: z.boolean().default(false),
					}),
					description: "A checkbox input",
				},
				form: {
					schema: z.object({
						type: z.literal("form"),
						id: z.string(),
					}),
					description: "The root form container",
					hasChildren: true,
				},
			},
		};

		const result = generateCatalogPrompt(catalog);

		// Should include all component types
		expect(result).toContain("### text");
		expect(result).toContain("### checkbox");
		expect(result).toContain("### form");

		// Should include all descriptions
		expect(result).toContain("A text input field");
		expect(result).toContain("A checkbox input");
		expect(result).toContain("The root form container");

		// Should show children indicator only for form
		expect(result).toContain("**Can contain children:** Yes");
		const childrenMatches = result.match(/\*\*Can contain children:\*\* Yes/g);
		expect(childrenMatches).toHaveLength(1);
	});

	it("should include all required sections in the prompt", () => {
		const catalog: Catalog = {
			components: {
				text: {
					schema: z.object({
						type: z.literal("text"),
						id: z.string(),
					}),
					description: "A text input field",
				},
			},
		};

		const result = generateCatalogPrompt(catalog);

		// Should include preamble
		expect(result).toContain("Form Engine Schema Documentation");

		// Should include components section
		expect(result).toContain("## Available Components");

		// Should include schema structure rules
		expect(result).toContain("## Schema Structure Rules");

		// Should include conditional logic documentation
		expect(result).toContain("## Conditional Logic");

		// Should include validation rules documentation
		expect(result).toContain("## Validation Rules");
	});

	it("should use custom preamble when provided", () => {
		const catalog: Catalog = {
			components: {
				text: {
					schema: z.object({
						type: z.literal("text"),
						id: z.string(),
					}),
				},
			},
		};

		const customPreamble = "# Custom Form Documentation\n\nThis is a custom preamble.";
		const result = generateCatalogPrompt(catalog, { preamble: customPreamble });

		expect(result).toContain("Custom Form Documentation");
		expect(result).toContain("This is a custom preamble");
		expect(result).not.toContain("Form Engine Schema Documentation");
	});
});
