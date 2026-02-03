// packages/form-engine/src/catalog/__tests__/prompt.test.ts
// Unit tests for formatPropsFromZodSchema()

import { describe, it, expect } from "vitest";
import { z } from "zod";
import { formatPropsFromZodSchema } from "../prompt";

describe("formatPropsFromZodSchema", () => {
	describe("basic property extraction", () => {
		it("should extract required string property", () => {
			const schema = z.object({
				name: z.string(),
			});

			const result = formatPropsFromZodSchema(schema);

			expect(result).toContain("**name**");
			expect(result).toContain("string");
			expect(result).toContain("[Required]");
		});

		it("should extract optional string property", () => {
			const schema = z.object({
				name: z.string().optional(),
			});

			const result = formatPropsFromZodSchema(schema);

			expect(result).toContain("**name**");
			expect(result).toContain("string");
			expect(result).toContain("[Optional]");
		});

		it("should extract number property", () => {
			const schema = z.object({
				age: z.number(),
			});

			const result = formatPropsFromZodSchema(schema);

			expect(result).toContain("**age**");
			expect(result).toContain("number");
			expect(result).toContain("[Required]");
		});

		it("should extract boolean property", () => {
			const schema = z.object({
				active: z.boolean(),
			});

			const result = formatPropsFromZodSchema(schema);

			expect(result).toContain("**active**");
			expect(result).toContain("boolean");
			expect(result).toContain("[Required]");
		});
	});

	describe("default values", () => {
		it("should extract default value for string", () => {
			const schema = z.object({
				name: z.string().default("John"),
			});

			const result = formatPropsFromZodSchema(schema);

			expect(result).toContain("Default: `\"John\"`");
		});

		it("should extract default value for number", () => {
			const schema = z.object({
				count: z.number().default(42),
			});

			const result = formatPropsFromZodSchema(schema);

			expect(result).toContain("Default: `42`");
		});

		it("should extract default value for boolean", () => {
			const schema = z.object({
				enabled: z.boolean().default(true),
			});

			const result = formatPropsFromZodSchema(schema);

			expect(result).toContain("Default: `true`");
		});
	});

	describe("constraints", () => {
		it("should extract minLength constraint", () => {
			const schema = z.object({
				username: z.string().min(3),
			});

			const result = formatPropsFromZodSchema(schema);

			expect(result).toContain("minLength: 3");
		});

		it("should extract maxLength constraint", () => {
			const schema = z.object({
				username: z.string().max(20),
			});

			const result = formatPropsFromZodSchema(schema);

			expect(result).toContain("maxLength: 20");
		});

		it("should extract min constraint for numbers", () => {
			const schema = z.object({
				age: z.number().min(18),
			});

			const result = formatPropsFromZodSchema(schema);

			expect(result).toContain("min: 18");
		});

		it("should extract max constraint for numbers", () => {
			const schema = z.object({
				age: z.number().max(100),
			});

			const result = formatPropsFromZodSchema(schema);

			expect(result).toContain("max: 100");
		});

		it("should extract multiple constraints", () => {
			const schema = z.object({
				username: z.string().min(3).max(20),
			});

			const result = formatPropsFromZodSchema(schema);

			expect(result).toContain("minLength: 3");
			expect(result).toContain("maxLength: 20");
		});
	});

	describe("enum types", () => {
		it("should extract enum values", () => {
			const schema = z.object({
				status: z.enum(["active", "inactive", "pending"]),
			});

			const result = formatPropsFromZodSchema(schema);

			expect(result).toContain("enum:");
			expect(result).toContain('"active"');
			expect(result).toContain('"inactive"');
			expect(result).toContain('"pending"');
		});

		it("should extract literal values", () => {
			const schema = z.object({
				type: z.literal("text"),
			});

			const result = formatPropsFromZodSchema(schema);

			expect(result).toContain("literal:");
			expect(result).toContain('"text"');
		});
	});

	describe("array types", () => {
		it("should extract array of strings", () => {
			const schema = z.object({
				tags: z.array(z.string()),
			});

			const result = formatPropsFromZodSchema(schema);

			expect(result).toContain("**tags**");
			expect(result).toContain("array<string>");
		});

		it("should extract array of numbers", () => {
			const schema = z.object({
				scores: z.array(z.number()),
			});

			const result = formatPropsFromZodSchema(schema);

			expect(result).toContain("array<number>");
		});

		it("should extract array with minItems constraint", () => {
			const schema = z.object({
				items: z.array(z.string()).min(1),
			});

			const result = formatPropsFromZodSchema(schema);

			expect(result).toContain("minItems: 1");
		});

		it("should extract array with maxItems constraint", () => {
			const schema = z.object({
				items: z.array(z.string()).max(10),
			});

			const result = formatPropsFromZodSchema(schema);

			expect(result).toContain("maxItems: 10");
		});
	});

	describe("union types", () => {
		it("should extract union of string and number", () => {
			const schema = z.object({
				value: z.union([z.string(), z.number()]),
			});

			const result = formatPropsFromZodSchema(schema);

			// The implementation uses commas, not pipes
			expect(result).toMatch(/string.*number/);
		});

		it("should extract union with optional", () => {
			const schema = z.object({
				value: z.string().or(z.number()),
			});

			const result = formatPropsFromZodSchema(schema);

			// The implementation uses commas, not pipes
			expect(result).toMatch(/string.*number/);
		});
	});

	describe("nested objects", () => {
		it("should indicate object type for nested objects", () => {
			const schema = z.object({
				address: z.object({
					street: z.string(),
					city: z.string(),
				}),
			});

			const result = formatPropsFromZodSchema(schema);

			expect(result).toContain("**address**");
			expect(result).toContain("object");
		});
	});

	describe("multiple properties", () => {
		it("should extract all properties from complex schema", () => {
			const schema = z.object({
				id: z.string(),
				name: z.string().optional(),
				age: z.number().min(0).max(120),
				email: z.string().default("user@example.com"),
				status: z.enum(["active", "inactive"]),
			});

			const result = formatPropsFromZodSchema(schema);

			// Check all properties are present
			expect(result).toContain("**id**");
			expect(result).toContain("**name**");
			expect(result).toContain("**age**");
			expect(result).toContain("**email**");
			expect(result).toContain("**status**");

			// Check required/optional status
			expect(result).toMatch(/\*\*id\*\*.*\[Required\]/);
			expect(result).toMatch(/\*\*name\*\*.*\[Optional\]/);

			// Check constraints
			expect(result).toContain("min: 0");
			expect(result).toContain("max: 120");

			// Check default
			expect(result).toContain("Default: `\"user@example.com\"`");

			// Check enum
			expect(result).toContain("enum:");
		});
	});

	describe("edge cases", () => {
		it("should handle empty object schema", () => {
			const schema = z.object({});

			const result = formatPropsFromZodSchema(schema);

			expect(result).toBe("No properties defined.");
		});

		it("should handle non-object schema gracefully", () => {
			const schema = z.string();

			const result = formatPropsFromZodSchema(schema);

			expect(result).toBe("No properties defined.");
		});

		it("should handle schema with description", () => {
			const schema = z.object({
				name: z.string().describe("The user's full name"),
			});

			const result = formatPropsFromZodSchema(schema);

			expect(result).toContain("**name**");
			expect(result).toContain("The user's full name");
		});
	});

	describe("real-world component schemas", () => {
		it("should handle text field schema", () => {
			const schema = z.object({
				type: z.literal("text"),
				id: z.string().min(1),
				label: z.string().optional(),
				placeholder: z.string().optional(),
				defaultValue: z.string().optional(),
				validation: z.object({
					required: z.boolean().optional(),
					minLength: z.number().optional(),
					maxLength: z.number().optional(),
				}).optional(),
			});

			const result = formatPropsFromZodSchema(schema);

			expect(result).toContain("**type**");
			expect(result).toContain("literal: \"text\"");
			expect(result).toContain("**id**");
			expect(result).toContain("[Required]");
			expect(result).toContain("**label**");
			expect(result).toContain("[Optional]");
			expect(result).toContain("**validation**");
			expect(result).toContain("object");
		});

		it("should handle number field schema with constraints", () => {
			const schema = z.object({
				type: z.literal("number"),
				id: z.string().min(1),
				label: z.string().optional(),
				min: z.number().optional(),
				max: z.number().optional(),
				step: z.number().optional(),
				defaultValue: z.number().optional(),
			});

			const result = formatPropsFromZodSchema(schema);

			expect(result).toContain("**type**");
			expect(result).toContain("**min**");
			expect(result).toContain("**max**");
			expect(result).toContain("**step**");
			expect(result).toContain("[Optional]");
		});

		it("should handle select field schema with enum", () => {
			const schema = z.object({
				type: z.literal("select"),
				id: z.string().min(1),
				label: z.string().optional(),
				options: z.array(z.object({
					label: z.string(),
					value: z.string(),
				})),
			});

			const result = formatPropsFromZodSchema(schema);

			expect(result).toContain("**type**");
			expect(result).toContain("**options**");
			expect(result).toContain("array<object>");
			expect(result).toContain("[Required]");
		});
	});
});
