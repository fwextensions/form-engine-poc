import { describe, it, expect } from "vitest";
import { applyPatch, applyPatches } from "../jsonl/patch-applier";
import type { SchemaComponent } from "../jsonl/types";

const base = (): SchemaComponent => ({
	type: "form",
	id: "f",
	children: [
		{ type: "page", id: "p1", title: "One", children: [{ type: "text", id: "name", label: "Name" }] },
	],
});

describe("patch applier validates against the registry", () => {
	it("adds a valid component", () => {
		const r = applyPatch(base(), { op: "add", parentId: "p1", component: { type: "email", id: "email", label: "Email*" } });
		expect(r.success).toBe(true);
		expect(r.schema.children![0].children!.map((c) => c.id)).toEqual(["name", "email"]);
	});

	it("rejects an unknown component type and leaves the schema untouched", () => {
		const before = base();
		const r = applyPatch(before, { op: "add", parentId: "p1", component: { type: "radio", id: "r" } });
		expect(r.success).toBe(false);
		expect(r.error).toMatch(/Unknown component type "radio"/);
		expect(r.error).toMatch(/radiogroup/);
		expect(r.schema).toBe(before);
	});

	it("rejects unknown properties", () => {
		const r = applyPatch(base(), { op: "add", parentId: "p1", component: { type: "text", id: "x", lable: "typo" } });
		expect(r.success).toBe(false);
		expect(r.error).toMatch(/lable/);
	});

	it("rejects a page inside a page", () => {
		const r = applyPatch(base(), { op: "add", parentId: "p1", component: { type: "page", id: "p2", children: [] } });
		expect(r.success).toBe(false);
		expect(r.error).toMatch(/cannot contain a page/);
	});

	it("rejects children on a leaf component", () => {
		const r = applyPatch(base(), { op: "add", parentId: "name", component: { type: "text", id: "y" } });
		expect(r.success).toBe(false);
		expect(r.error).toMatch(/cannot contain children/);
	});

	it("rejects duplicate ids", () => {
		const r = applyPatch(base(), { op: "add", parentId: "p1", component: { type: "text", id: "name" } });
		expect(r.success).toBe(false);
		expect(r.error).toMatch(/already exists/);
	});

	it("rejects an update that makes the component invalid, and keeps the old state", () => {
		const r = applyPatch(base(), { op: "update", id: "name", props: { validation: { requried: true } } });
		expect(r.success).toBe(false);
		expect(r.error).toMatch(/requried/);
		expect(r.schema.children![0].children![0]).not.toHaveProperty("validation");
	});

	it("applies a valid update", () => {
		const r = applyPatch(base(), { op: "update", id: "name", props: { label: "Full name*", validation: { minLength: 2 } } });
		expect(r.success).toBe(true);
		expect(r.schema.children![0].children![0]).toMatchObject({ label: "Full name*", validation: { minLength: 2 } });
	});

	it("rejects a replacement schema with errors", () => {
		const r = applyPatch(base(), { op: "replace", schema: { type: "form", id: "f", children: [{ type: "text", id: 7 as unknown as string }] } });
		expect(r.success).toBe(false);
		expect(r.error).toMatch(/children\[0\]\.id/);
	});

	it("rejects a move into a leaf", () => {
		const r = applyPatch(base(), { op: "move", id: "name", parentId: "name" });
		expect(r.success).toBe(false);
	});

	it("keeps applying later patches after a rejected one", () => {
		const r = applyPatches(base(), [
			{ op: "add", parentId: "p1", component: { type: "nope", id: "n" } },
			{ op: "add", parentId: "p1", component: { type: "checkbox", id: "agree", label: "Agree" } },
			{ op: "message", text: "done" },
		]);
		expect(r.failureCount).toBe(1);
		expect(r.successCount).toBe(2);
		expect(r.schema.children![0].children!.map((c) => c.id)).toEqual(["name", "agree"]);
	});
});
