import type { SchemaComponent } from "@/lib/jsonl/types";
import type { PatchOp } from "@/lib/jsonl/types";

export function getFieldIdFromPatch(patch: PatchOp): string | null {
	switch (patch.op) {
		case "add":
			return patch.component.id ?? null;
		case "update":
		case "move":
			return patch.id;
		case "remove":
		case "replace":
		case "message":
			return null;
	}
}

function findInTree(node: SchemaComponent, fieldId: string): boolean {
	if (node.id === fieldId) return true;
	if (Array.isArray(node.children)) {
		return node.children.some((child) => findInTree(child, fieldId));
	}
	return false;
}

export function findPageIndexForField(
	schema: SchemaComponent | null,
	fieldId: string,
): number | null {
	if (!schema || schema.type !== "form" || !Array.isArray(schema.children)) {
		return null;
	}

	const pages = schema.children.filter((c) => c.type === "page");
	if (pages.length === 0) return null;

	for (let i = 0; i < pages.length; i++) {
		if (findInTree(pages[i], fieldId)) return i;
	}

	return null;
}

export function highlightFieldElement(fieldId: string): void {
	const el =
		document.querySelector(`[data-field-id="${fieldId}"]`) ??
		document.getElementById(fieldId)?.closest("[data-field-id]") ??
		document.getElementById(fieldId);

	if (!el || !(el instanceof HTMLElement)) return;

	el.scrollIntoView({ behavior: "smooth", block: "center" });

	el.classList.remove("field-highlight", "field-highlight-fade");
	// force reflow so re-adding the class restarts the animation
	void el.offsetWidth;
	el.classList.add("field-highlight");

	setTimeout(() => {
		el.classList.add("field-highlight-fade");
	}, 1600);

	setTimeout(() => {
		el.classList.remove("field-highlight", "field-highlight-fade");
	}, 4000);
}
