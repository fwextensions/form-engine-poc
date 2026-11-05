// The generated JSON Schema must agree with the Zod schemas it is derived from:
// every committed example document validates, and the things the registry
// rejects (unknown keys, unknown types, bad nesting) are rejected here too.

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import { Ajv2020 } from "ajv/dist/2020";
import "../../components";
import { getRegisteredCatalog } from "../../core/componentFactory";
import { catalogToFormJsonSchema } from "../toJsonSchema";

const catalog = getRegisteredCatalog();
const jsonSchema = catalogToFormJsonSchema(catalog);
const ajv = new Ajv2020({ allErrors: true, strict: false });
const validate = ajv.compile(jsonSchema);

const errorsOf = (doc: unknown) => (validate(doc) ? [] : (validate.errors ?? []).map((e) => `${e.instancePath} ${e.message}`));

describe("catalogToFormJsonSchema", () => {
	it("defines every registered type and roots at form", () => {
		expect(Object.keys(jsonSchema.$defs).sort()).toEqual(Object.keys(catalog.components).sort());
		expect(jsonSchema.$ref).toBe("#/$defs/form");
	});

	it("wires children to the allowed types", () => {
		const pageItems = jsonSchema.$defs.page.properties.children.items;
		const refs = (pageItems.anyOf ?? [pageItems]).map((r: { $ref: string }) => r.$ref.replace("#/$defs/", ""));
		expect(refs).not.toContain("page");
		expect(refs).not.toContain("form");
		expect(refs).toContain("text");
		expect(jsonSchema.$defs.text.properties).not.toHaveProperty("children");
	});

	it("accepts every component example", () => {
		for (const [type, entry] of Object.entries(catalog.components)) {
			if (type === "form") continue;
			const doc = { type: "form", id: "f", children: [{ type, ...entry.meta?.example }] };
			expect(errorsOf(doc), type).toEqual([]);
		}
	});

	const dir = path.resolve(__dirname, "../../../test-schemas");
	it.each(fs.readdirSync(dir).filter((f) => f.endsWith(".yaml")))("accepts %s", (file) => {
		const doc = yaml.load(fs.readFileSync(path.join(dir, file), "utf8"));
		expect(errorsOf(doc)).toEqual([]);
	});

	it("rejects unknown properties, unknown types and bad nesting", () => {
		expect(errorsOf({ type: "form", id: "f", children: [{ type: "text", id: "a", lable: "x" }] }).length).toBeGreaterThan(0);
		expect(errorsOf({ type: "form", id: "f", children: [{ type: "radio", id: "a" }] }).length).toBeGreaterThan(0);
		expect(errorsOf({ type: "form", id: "f", children: [{ type: "page", id: "p", children: [{ type: "page", id: "q" }] }] }).length).toBeGreaterThan(0);
		expect(errorsOf({ type: "page", id: "p" }).length).toBeGreaterThan(0);
	});
});
