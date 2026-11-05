// Keeps the Fillout exporter in step with the form-engine component registry.

import { describe, it, expect } from "vitest";
import { getAllComponentDefinitions } from "form-engine";
import { exportToFillout, getSupportedComponentTypes } from "../index";

describe("fillout exporter coverage", () => {
	const registered = [...getAllComponentDefinitions().keys()];
	const supported = new Set(getSupportedComponentTypes());

	it("has a mapper for every registered non-layout type", () => {
		const missing = [...getAllComponentDefinitions().values()]
			.filter((def) => def.kind !== "layout" && !supported.has(def.type))
			.map((def) => def.type);
		expect(missing).toEqual([]);
	});

	it("does not map types the engine no longer registers", () => {
		const stale = [...supported].filter((type) => !registered.includes(type));
		expect(stale).toEqual([]);
	});

	it("emits a diagnostic instead of silently dropping an unknown type", () => {
		const { output, diagnostics } = exportToFillout({
			type: "form",
			id: "f",
			children: [{ type: "mystery", id: "m", label: "M" }],
		});
		expect(output).toBeTruthy();
		expect(diagnostics.some((d) => d.componentType === "mystery" && /no Fillout mapping/.test(d.message))).toBe(true);
	});
});
