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

describe("fillout exporter uses validated config", () => {
	function widgets(form: Record<string, unknown>) {
		const { output, diagnostics } = exportToFillout({ type: "form", id: "f", ...form });
		const steps = Object.values((output.template as any).steps as Record<string, any>).filter((s) => s.type === "form");
		const all = steps.flatMap((s) => Object.values(s.template.widgets as Record<string, any>)).filter((w) => w.type !== "Button");
		return { widgets: all as Array<{ type: string; template: any }>, diagnostics };
	}
	const text = (logic: any) => logic?.logic?.value ?? logic?.value ?? logic;

	it("strips the label asterisk and marks the field required", () => {
		const { widgets: w } = widgets({ children: [{ type: "text", id: "name", label: "Full name*" }] });
		expect(w).toHaveLength(1);
		expect(text(w[0].template.label)).toBe("Full name");
		expect(w[0].template.required.logic).toBe(true);
	});

	it("exports string-shorthand options with labels and values", () => {
		const { widgets: w } = widgets({ children: [{ type: "select", id: "s", label: "S", options: ["Alpha", "Beta"] }] });
		const labels = w[0].template.options.staticOptions.map((o: any) => text(o.label));
		const values = w[0].template.options.staticOptions.map((o: any) => text(o.value));
		expect(labels).toEqual(["Alpha", "Beta"]);
		expect(values).toEqual(["Alpha", "Beta"]);
	});

	it("still exports a field whose config does not validate, with a diagnostic", () => {
		const { widgets: w, diagnostics } = widgets({ children: [{ type: "select", id: "s", label: "S" }] }); // options missing
		expect(w).toHaveLength(1);
		expect(diagnostics.some((d) => d.componentId === "s" && /invalid configuration/.test(d.message))).toBe(true);
	});

	it("flattens nested layout components into the page", () => {
		const { widgets: w } = widgets({
			children: [
				{ type: "page", id: "p1", children: [{ type: "page", id: "inner", children: [{ type: "text", id: "a", label: "A" }] }, { type: "text", id: "b", label: "B" }] },
			],
		});
		expect(w.map((x) => text(x.template.label))).toEqual(["A", "B"]);
	});
});
