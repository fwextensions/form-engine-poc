import { describe, it, expect } from "vitest";
import "../index";
import { itemsFromValue, padItems, repeaterProblem } from "../fields/Repeater";
import { collectEntries, collectGroups, displayValue } from "../layout/reviewSummary";
import { getComponentDefinition, isPageNode } from "../../core/componentFactory";
import { validateSchemaTree } from "../../core/schemaParser";
import type { FormEngineContext } from "../../engine/FormEngineContext";
import type { FormConfig } from "../layout/Form";

describe("repeater helpers", () => {
	it("normalises stored values to item objects", () => {
		expect(itemsFromValue(undefined)).toEqual([]);
		expect(itemsFromValue([{ a: 1 }, null, "x"])).toEqual([{ a: 1 }, {}, {}]);
	});

	it("pads to minItems without touching longer lists", () => {
		expect(padItems([], 2)).toEqual([{}, {}]);
		expect(padItems([{ a: 1 }], 0)).toEqual([{ a: 1 }]);
		expect(padItems([{ a: 1 }, { a: 2 }, { a: 3 }], 2)).toHaveLength(3);
	});

	it("reports only the group's own constraints", () => {
		const base = { minItems: 0, itemLabel: "Phone number" };
		expect(repeaterProblem([], { ...base, required: true })).toBe("Add at least one phone number.");
		expect(repeaterProblem([], { ...base, required: false })).toBeNull();
		expect(repeaterProblem([], { ...base, required: true, minItems: 1 })).toBeNull(); // a blank item is shown
		expect(repeaterProblem([{}, {}, {}], { ...base, required: false, maxItems: 2 })).toMatch(/up to 2/);
	});

	it("validates its example and wires children through the registry", () => {
		const def = getComponentDefinition("repeater")!;
		expect(def.kind).toBe("field");
		expect(def.children).toBeDefined();
		const config = def.validateConfig({ type: "repeater", ...def.meta.example });
		expect(config.itemLabel).toBe("Household member");
		expect(config.children).toHaveLength(2);
	});
});

function contextWith(schema: FormConfig, formData: Record<string, unknown>, extra: Partial<FormEngineContext> = {}): FormEngineContext {
	return {
		formData,
		onDataChange: () => {},
		formContext: {},
		formMode: "edit",
		dynamicProps: {},
		schema,
		...extra,
	};
}

const schema = {
	type: "form",
	id: "f",
	display: "multipage",
	children: [
		{
			type: "page",
			id: "p1",
			title: "About you",
			children: [
				{ type: "name", id: "applicant", label: "Your name*" },
				{
					type: "section",
					id: "contact",
					title: "Contact",
					children: [
						{ type: "email", id: "email", label: "Email" },
						{ type: "yesno", id: "sms", label: "Text me?", yesLabel: "Sure", noLabel: "No thanks" },
						{ type: "select", id: "state", label: "State", options: [{ label: "California", value: "CA" }] },
						{ type: "checkboxgroup", id: "prefs", label: "Preferences", options: ["Veteran", "Senior"] },
						{ type: "text", id: "secret", label: "Hidden", hidden: true },
						{ type: "text", id: "gated", label: "Gated", condition: { "==": [{ var: "formData.sms" }, true] } },
					],
				},
				{ type: "html", content: "<p>static</p>" },
			],
		},
		{
			type: "page",
			id: "p2",
			title: "Household",
			children: [
				{
					type: "repeater",
					id: "members",
					label: "Household members",
					itemLabel: "Member",
					children: [
						{ type: "text", id: "memberName", label: "Name" },
						{ type: "dateOfBirth", id: "dob", label: "Date of birth" },
						{
							type: "text",
							id: "note",
							label: "Note",
							hidden: true,
							rules: [{ when: { field: "memberName", is: "Byron" }, then: [{ set: { hidden: false } }] }],
						},
					],
				},
			],
		},
		{ type: "reviewPage", id: "p3", title: "Review", children: [{ type: "checkbox", id: "certify", label: "I certify this is true*" }] },
	],
} as unknown as FormConfig;

describe("review", () => {
	it("formats values with the field's display function or a generic fallback", () => {
		expect(displayValue(getComponentDefinition("yesno"), { yesLabel: "Sure" }, true)).toBe("Sure");
		expect(displayValue(getComponentDefinition("select"), { options: [{ label: "California", value: "CA" }] }, "CA")).toBe("California");
		expect(displayValue(getComponentDefinition("checkboxgroup"), { options: [{ label: "Veteran", value: "veteran" }] }, ["veteran"])).toBe("Veteran");
		expect(displayValue(getComponentDefinition("date"), {}, "1990-03-04")).toBe("March 4, 1990");
		expect(displayValue(getComponentDefinition("name"), {}, { first: "Ada", middle: "", last: "Lovelace" })).toBe("Ada Lovelace");
		expect(displayValue(getComponentDefinition("checkbox"), {}, false)).toBe("No");
		expect(displayValue(undefined, {}, "")).toBeNull();
		expect(displayValue(undefined, {}, 42)).toBe("42");
		expect(displayValue(undefined, {}, ["a", "b"])).toBe("a, b");
	});

	it("groups entries by page, skips hidden and static nodes, and expands repeater items", () => {
		const data = {
			applicant: { first: "Ada", last: "Lovelace" },
			sms: true,
			state: "CA",
			prefs: ["Senior"],
			gated: "shown",
			members: [{ memberName: "Byron", dob: "2015-12-10", note: "revealed by an item rule" }, { note: "stays hidden" }],
		};
		const groups = collectGroups(contextWith(schema, data, { isMultiPage: true }), true);
		expect(groups.map((g) => [g.pageIndex, g.title])).toEqual([
			[0, "About you"],
			[1, "Household"],
		]);
		const first = groups[0].entries;
		expect(first.map((e) => (e.kind === "row" ? `${e.label}=${e.display}` : `# ${e.title}`))).toEqual([
			"Your name=Ada Lovelace",
			"# Contact",
			"Email=null",
			"Text me?=Sure",
			"State=California",
			"Preferences=Senior",
			"Gated=shown",
		]);
		const members = groups[1].entries[0];
		expect(members.kind).toBe("row");
		if (members.kind !== "row") return;
		expect(members.display).toBe("2 members");
		expect(members.items).toHaveLength(2);
		expect(members.items![0].map((e) => (e.kind === "row" ? e.display : null))).toEqual(["Byron", "December 10, 2015", "revealed by an item rule"]);
		expect(members.items![1].map((e) => (e.kind === "row" ? e.display : null))).toEqual([null, null]);
	});

	it("omits unanswered fields when showEmpty is false", () => {
		const groups = collectGroups(contextWith(schema, { sms: false }), false);
		const labels = groups.flatMap((g) => g.entries).filter((e) => e.kind === "row").map((e) => (e as { label: string }).label);
		expect(labels).toEqual(["Text me?"]);
	});

	it("respects dynamic props from rules", () => {
		const ctx = contextWith(schema, { email: "a@b.c" }, { dynamicProps: { email: { hidden: true } } });
		const entries = collectEntries((schema.children![0] as { children: unknown[] }).children, ctx.formData, { showEmpty: true, formContext: {}, dynamicProps: ctx.dynamicProps! });
		expect(entries.some((e) => e.kind === "row" && e.id === "email")).toBe(false);
	});

	it("counts the review page as a page but never summarises its own children", () => {
		expect(isPageNode({ type: "reviewPage" })).toBe(true);
		expect(isPageNode({ type: "section" })).toBe(false);
		const groups = collectGroups(contextWith(schema, { certify: true, sms: true }), true);
		expect(groups.map((g) => g.pageIndex)).toEqual([0, 1]);
		expect(groups.flatMap((g) => g.entries).some((e) => e.kind === "row" && e.id === "certify")).toBe(false);
	});

	it("warns when a reviewPage is not the last page or appears twice", () => {
		const codes = (children: unknown[]) => validateSchemaTree({ type: "form", id: "f", children }).map((i) => `${i.severity}:${i.code}@${i.path}`);
		expect(codes([{ type: "page", id: "a", children: [] }, { type: "reviewPage", id: "r" }])).toEqual([]);
		expect(codes([{ type: "reviewPage", id: "r" }, { type: "page", id: "a", children: [] }])).toEqual(["warning:review_page_position@children[0]"]);
		expect(codes([{ type: "reviewPage", id: "r1" }, { type: "reviewPage", id: "r2" }])).toEqual(["warning:review_page_position@children[0]"]);
		expect(codes([{ type: "page", id: "a", children: [{ type: "reviewPage", id: "r" }] }])).toEqual(["error:disallowed_child@children[0].children[0].type"]);
	});

	it("handles a form without pages as one group", () => {
		const flat = { type: "form", id: "f", children: [{ type: "text", id: "a", label: "A" }] } as unknown as FormConfig;
		const groups = collectGroups(contextWith(flat, { a: "x" }), true);
		expect(groups).toHaveLength(1);
		expect(groups[0].pageIndex).toBeUndefined();
	});
});
