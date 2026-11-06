// Keeps the Fillout exporter in step with the form-engine component registry.

import { describe, it, expect } from "vitest";
import { getAllComponentDefinitions } from "@fwextensions/form-engine";
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

describe("fillout exporter: newer field types", () => {
	function widgets(children: unknown[]) {
		const { output, diagnostics } = exportToFillout({ type: "form", id: "f", children });
		const steps = Object.values((output.template as any).steps as Record<string, any>).filter((s) => s.type === "form");
		const all = steps.flatMap((s) => Object.values(s.template.widgets as Record<string, any>)).filter((w) => w.type !== "Button");
		return { widgets: all as Array<{ type: string; template: any }>, diagnostics };
	}
	const text = (logic: any) => logic?.logic?.value ?? logic;

	it("exports checkboxgroup as Fillout Checkboxes", () => {
		const { widgets: w } = widgets([{ type: "checkboxgroup", id: "p", label: "Priorities", options: ["A", "B"] }]);
		expect(w.map((x) => x.type)).toEqual(["Checkboxes"]);
		expect(w[0].template.options.staticOptions.map((o: any) => text(o.label))).toEqual(["A", "B"]);
	});

	it("exports yesno as a two-option MultipleChoice", () => {
		const { widgets: w } = widgets([{ type: "yesno", id: "v", label: "Veteran?*", noLabel: "Nope" }]);
		expect(w[0].type).toBe("MultipleChoice");
		expect(w[0].template.options.staticOptions.map((o: any) => text(o.label))).toEqual(["Yes", "Nope"]);
		expect(w[0].template.required.logic).toBe(true);
	});

	it("expands name into first/middle/last short answers", () => {
		const { widgets: w } = widgets([{ type: "name", id: "n", label: "Your name*" }]);
		expect(w.map((x) => text(x.template.label))).toEqual(["Your name: First name", "Your name: Middle name", "Your name: Last name"]);
		expect(w.map((x) => x.template.required.logic)).toEqual([true, false, true]);
		const { widgets: two } = widgets([{ type: "name", id: "n", label: "Name", showMiddleName: false }]);
		expect(two).toHaveLength(2);
	});

	it("exports dateOfBirth as a DatePicker and notes unenforced age limits", () => {
		const { widgets: w, diagnostics } = widgets([{ type: "dateOfBirth", id: "dob", label: "DOB", minAge: 18 }]);
		expect(w[0].type).toBe("DatePicker");
		expect(diagnostics.some((d) => d.componentId === "dob" && /minAge/.test(d.message))).toBe(true);
	});

	it("emits a heading for a section and flattens its fields", () => {
		const { widgets: w } = widgets([
			{ type: "section", id: "s", title: "Your name", description: "As on your ID", children: [{ type: "text", id: "a", label: "A" }] },
		]);
		expect(w.map((x) => x.type)).toEqual(["Html", "ShortAnswer"]);
		expect(text(w[0].template.html ?? w[0].template.content ?? w[0].template.label)).toContain("Your name");
	});
});
