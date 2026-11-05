// Strict schemas: unknown keys are reported, never silently dropped.

import { describe, it, expect } from "vitest";
import "../../components";
import { getComponentDefinition } from "../componentFactory";
import { parseRootFormSchema, validateSchemaTree } from "../schemaParser";

const text = () => getComponentDefinition("text")!;

describe("validateConfig (strict)", () => {
	it("rejects unknown properties", () => {
		expect(() => text().validateConfig({ type: "text", id: "a", labell: "typo" })).toThrow(/labell/);
	});

	it("rejects unknown validation keys", () => {
		expect(() => text().validateConfig({ type: "text", id: "a", validation: { requried: true } })).toThrow(/requried/);
	});

	it("accepts the validation keys the engine enforces", () => {
		const config = text().validateConfig({ type: "text", id: "a", validation: { required: true, minLength: 2, maxLength: 5, pattern: "^a" } });
		expect(config.validation).toEqual({ required: true, minLength: 2, maxLength: 5, pattern: "^a" });
	});
});

describe("checkConfig (lenient)", () => {
	it("strips unknown keys and reports them as warnings", () => {
		const check = text().checkConfig({ type: "text", id: "a", label: "A*", labell: "typo" });
		expect(check.config).toMatchObject({ id: "a", label: "A", validation: { required: true } });
		expect(check.config).not.toHaveProperty("labell");
		expect(check.issues).toEqual([
			expect.objectContaining({ severity: "warning", code: "unknown_key", path: ["labell"] }),
		]);
	});

	it("reports real errors with no config", () => {
		const check = text().checkConfig({ type: "text", id: 42 });
		expect(check.config).toBeUndefined();
		expect(check.issues.some((i) => i.severity === "error" && i.path[0] === "id")).toBe(true);
	});

	it("reports a type mismatch", () => {
		const check = text().checkConfig({ type: "select", id: "a" });
		expect(check.config).toBeUndefined();
		expect(check.issues[0].path).toEqual(["type"]);
	});
});

describe("validateSchemaTree", () => {
	const form = (children: unknown[]) => ({ type: "form", id: "f", children });

	it("returns no issues for a valid tree", () => {
		expect(validateSchemaTree(form([{ type: "page", id: "p", children: [{ type: "text", id: "a", label: "A" }] }]))).toEqual([]);
	});

	it("reports unknown types with the available types", () => {
		const issues = validateSchemaTree(form([{ type: "radio", id: "r" }]));
		expect(issues).toHaveLength(1);
		expect(issues[0]).toMatchObject({ severity: "error", code: "unknown_type", path: "children[0].type", componentId: "r" });
		expect(issues[0].message).toContain("radiogroup");
	});

	it("reports unknown properties deep in the tree as warnings with a path", () => {
		const issues = validateSchemaTree(form([{ type: "page", id: "p", children: [{ type: "text", id: "a", lable: "A" }] }]));
		expect(issues).toEqual([
			expect.objectContaining({ severity: "warning", code: "unknown_key", path: "children[0].children[0].lable", componentId: "a" }),
		]);
	});

	it("reports disallowed nesting", () => {
		const issues = validateSchemaTree(form([{ type: "page", id: "p", children: [{ type: "page", id: "inner" }] }]));
		expect(issues.some((i) => i.code === "disallowed_child" && i.componentId === "inner")).toBe(true);
		const leaf = validateSchemaTree(form([{ type: "text", id: "t", children: [{ type: "text", id: "u" }] }]));
		expect(leaf.some((i) => i.code === "unknown_key" && i.path === "children[0].children")).toBe(true);
	});

	it("reports duplicate ids as warnings", () => {
		const issues = validateSchemaTree(form([{ type: "text", id: "a" }, { type: "text", id: "a" }]));
		expect(issues).toEqual([expect.objectContaining({ severity: "warning", code: "duplicate_id", path: "children[1].id" })]);
	});
});

describe("parseRootFormSchema", () => {
	it("returns the root config even when a child has an error, so the rest still renders", () => {
		const result = parseRootFormSchema({ type: "form", id: "f", children: [{ type: "text", id: 1 }] });
		expect(result.config).toMatchObject({ type: "form", id: "f" });
		expect(result.errors).toBeDefined();
		expect(result.issues.some((i) => i.severity === "error")).toBe(true);
	});

	it("returns warnings without errors for unknown keys", () => {
		const result = parseRootFormSchema({ type: "form", id: "f", children: [{ type: "text", id: "a", lable: "x" }] });
		expect(result.errors).toBeUndefined();
		expect(result.issues.map((i) => i.severity)).toEqual(["warning"]);
	});

	it("returns null config for a non-object", () => {
		expect(parseRootFormSchema("nope").config).toBeNull();
	});
});
