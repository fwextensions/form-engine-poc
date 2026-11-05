// Invariants that keep the catalog, its derived artifacts, and the committed
// example schemas in sync. If one of these fails, something downstream of
// createComponent() has drifted from the registry.

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import "../../components";
import { getAllComponentDefinitions, getRegisteredCatalog } from "../../core/componentFactory";
import { validateSchemaTree } from "../../core/schemaParser";
import { catalogToJsonSchema } from "../toJsonSchema";
import { generateCatalogPrompt } from "../prompt";

const catalog = getRegisteredCatalog();
const registeredTypes = Object.keys(catalog.components);

describe("catalog invariants", () => {
	it("has at least the core component types registered", () => {
		for (const type of ["form", "page", "html", "text", "select", "checkbox", "radiogroup"]) {
			expect(registeredTypes).toContain(type);
		}
	});

	it("produces a JSON Schema with id and type properties for every registered type", () => {
		const schemas = catalogToJsonSchema(catalog);
		for (const type of registeredTypes) {
			const props = schemas[type]?.properties ?? {};
			expect(Object.keys(props), `${type} has no properties`).toContain("type");
			expect(Object.keys(props), `${type} has no id`).toContain("id");
			expect(schemas[type].properties.type.const, `${type} literal`).toBe(type);
		}
	});

	it("only mentions registered component types in the generated prompt", () => {
		const prompt = generateCatalogPrompt(catalog, { includeExamples: true });
		const mentioned = new Set<string>();
		for (const m of prompt.matchAll(/^\s*-?\s*type:\s*([A-Za-z]+)\s*$/gm)) {
			mentioned.add(m[1]);
		}
		for (const m of prompt.matchAll(/"type":"([A-Za-z]+)"/g)) {
			mentioned.add(m[1]);
		}
		expect(mentioned.size).toBeGreaterThan(0);
		for (const type of mentioned) {
			expect(registeredTypes, `prompt mentions unregistered type "${type}"`).toContain(type);
		}
	});

	it("documents properties for every registered type in the prompt", () => {
		const prompt = generateCatalogPrompt(catalog);
		expect(prompt).not.toContain("No properties defined.");
		expect(prompt).not.toContain("Error extracting properties");
	});
});

describe("committed example schemas", () => {
	const dir = path.resolve(__dirname, "../../../test-schemas");
	const files = fs.readdirSync(dir).filter((f) => f.endsWith(".yaml"));

	it.each(files)("%s validates against the registry", (file) => {
		const raw = yaml.load(fs.readFileSync(path.join(dir, file), "utf8"));
		const problems = validateSchemaTree(raw).map((issue) => `${issue.severity} ${issue.path}: ${issue.message}`);
		expect(problems).toEqual([]);
	});

	it("registers every type exactly once", () => {
		expect(getAllComponentDefinitions().size).toBe(registeredTypes.length);
	});
});
