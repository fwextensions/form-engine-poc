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

/**
 * Find the nearest ancestor that is actually scrollable (has overflow auto/scroll
 * and whose scrollHeight exceeds its clientHeight). Stops at <body> so we never
 * accidentally scroll the page itself.
 */
function findScrollParent(el: HTMLElement): HTMLElement | null {
	let node: HTMLElement | null = el.parentElement;
	while (node && node !== document.body) {
		const { overflowY } = window.getComputedStyle(node);
		if (
			(overflowY === "auto" || overflowY === "scroll") &&
			node.scrollHeight > node.clientHeight
		) {
			return node;
		}
		node = node.parentElement;
	}
	return null;
}

/**
 * Scroll `el` into view within its nearest scrollable ancestor only —
 * never the page itself — centered vertically with smooth animation.
 */
function scrollIntoScrollParent(el: HTMLElement): void {
	const container = findScrollParent(el);
	if (!container) {
		// No scrollable ancestor found — safe to call native scrollIntoView
		// with block:nearest so we don't jump the page viewport.
		el.scrollIntoView({ behavior: "smooth", block: "nearest" });
		return;
	}

	const containerRect = container.getBoundingClientRect();
	const elRect = el.getBoundingClientRect();

	// Target: center the element vertically within the container
	const targetScrollTop =
		container.scrollTop +
		(elRect.top - containerRect.top) -
		containerRect.height / 2 +
		elRect.height / 2;

	container.scrollTo({ top: targetScrollTop, behavior: "smooth" });
}

export function highlightFieldElement(fieldId: string, edge?: HighlightEdge): void {
	const el =
		document.querySelector(`[data-field-id="${fieldId}"]`) ??
		document.getElementById(fieldId)?.closest("[data-field-id]") ??
		document.getElementById(fieldId);

	if (!el || !(el instanceof HTMLElement)) return;

	scrollIntoScrollParent(el);

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
