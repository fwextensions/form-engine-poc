import type { SchemaComponent } from "@/lib/jsonl/types";
import type { PatchWithResult } from "@/components/chat/ValidationContext";
import type { HighlightEdge } from "@/components/chat/FieldHighlightContext";

export type HighlightTarget = {
	fieldId: string;
	edge?: HighlightEdge;
} | null;

export function getHighlightTarget(card: PatchWithResult): HighlightTarget {
	const { patch, nearFieldId, nearFieldPosition } = card;
	switch (patch.op) {
		case "add":
			return patch.component.id ? { fieldId: patch.component.id } : null;
		case "update":
		case "move":
			return { fieldId: patch.id };
		case "remove":
			if (!nearFieldId) return null;
			return {
				fieldId: nearFieldId,
				edge: nearFieldPosition === "before" ? "top" : "bottom",
			};
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

const ALL_HIGHLIGHT_CLASSES = [
	"field-highlight", "field-highlight-fade",
	"field-highlight-edge-top", "field-highlight-edge-bottom", "field-highlight-edge-fade",
];

export function highlightFieldElement(fieldId: string, edge?: HighlightEdge): void {
	const el =
		document.querySelector(`[data-field-id="${fieldId}"]`) ??
		document.getElementById(fieldId)?.closest("[data-field-id]") ??
		document.getElementById(fieldId);

	if (!el || !(el instanceof HTMLElement)) return;

	el.scrollIntoView({ behavior: "smooth", block: "center" });

	el.classList.remove(...ALL_HIGHLIGHT_CLASSES);
	void el.offsetWidth;

	if (edge) {
		el.classList.add(edge === "top" ? "field-highlight-edge-top" : "field-highlight-edge-bottom");

		setTimeout(() => {
			el.classList.add("field-highlight-edge-fade");
		}, 1600);

		setTimeout(() => {
			el.classList.remove(...ALL_HIGHLIGHT_CLASSES);
		}, 4000);
	} else {
		el.classList.add("field-highlight");

		setTimeout(() => {
			el.classList.add("field-highlight-fade");
		}, 1600);

		setTimeout(() => {
			el.classList.remove(...ALL_HIGHLIGHT_CLASSES);
		}, 4000);
	}
}
