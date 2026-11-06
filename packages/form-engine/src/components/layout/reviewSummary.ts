// packages/form-engine/src/components/layout/reviewSummary.ts
// Builds the answer summary a reviewPage shows: walks the form config from
// the engine context and turns every visible field into a labelled line,
// grouped by page. No React here so it can be unit tested directly.
import { getComponentDefinition, isPageNode, type ComponentDefinition } from "../../core/componentFactory";
import { evaluateCondition } from "../../core/conditionLogic";
import { deepMerge } from "../../utils/deepMerge";
import { computeDynamicProps } from "../../hooks/useFormRules";
import type { FormEngineContext } from "../../engine/FormEngineContext";

/** The type that renders the summary; its own children are not summarised. */
export const REVIEW_PAGE_TYPE = "reviewPage";

/** One line of the summary. */
export type ReviewEntry =
	| { kind: "heading"; title: string; description?: string }
	| { kind: "row"; id: string; label: string; display: string | null; items?: ReviewEntry[][] };

/** A page of the summary: its entries plus the page index to edit. */
export interface ReviewGroup {
	pageIndex?: number;
	title?: string;
	entries: ReviewEntry[];
}

/** Human-readable text for a field value: the field's own `display`, or a generic rendering. */
export function displayValue(definition: ComponentDefinition | undefined, config: Record<string, unknown>, value: unknown): string | null {
	if (definition?.value?.display) return definition.value.display(value, config);
	if (value === undefined || value === null || value === "") return null;
	if (typeof value === "boolean") return value ? "Yes" : "No";
	if (Array.isArray(value)) return value.length ? value.map(String).join(", ") : null;
	if (typeof value === "object") {
		const parts = Object.values(value as Record<string, unknown>).filter((v) => v !== undefined && v !== null && v !== "");
		return parts.length ? parts.map(String).join(" ") : null;
	}
	return String(value);
}

export interface WalkOptions {
	showEmpty: boolean;
	formContext: Record<string, unknown>;
	dynamicProps: Record<string, Record<string, unknown>>;
}

/** The config the renderer would use: rule props merged, lenient-checked; null when hidden or unusable. */
function resolveNode(raw: unknown, data: Record<string, unknown>, options: WalkOptions): { config: Record<string, any>; definition: ComponentDefinition } | null {
	if (!raw || typeof raw !== "object" || typeof (raw as { type?: unknown }).type !== "string") return null;
	const definition = getComponentDefinition((raw as { type: string }).type);
	if (!definition) return null;
	const id = (raw as { id?: unknown }).id;
	const dynamic = typeof id === "string" ? options.dynamicProps[id] : undefined;
	const config = definition.checkConfig(dynamic ? deepMerge(raw as Record<string, any>, dynamic) : raw).config as Record<string, any> | undefined;
	if (!config) return null;
	if (config.hidden || (config.condition && !evaluateCondition(config.condition, data, options.formContext))) return null;
	return { config, definition };
}

/**
 * Collects the summary entries for a list of component configs against the
 * given data. Layout components contribute a heading (when titled) and their
 * children; fields contribute a row; static content is skipped. A field with
 * children (a repeating group) lists each item's rows under it.
 */
export function collectEntries(children: unknown[] | undefined, data: Record<string, unknown>, options: WalkOptions): ReviewEntry[] {
	const entries: ReviewEntry[] = [];
	for (const raw of children ?? []) {
		const resolved = resolveNode(raw, data, options);
		if (!resolved) continue;
		const { config, definition } = resolved;

		if (definition.kind === "field" && typeof config.id === "string") {
			const value = data[config.id] !== undefined ? data[config.id] : config.defaultValue;
			const label = typeof config.label === "string" && config.label ? config.label : config.id;
			if (definition.children) {
				const items = Array.isArray(value) ? (value as unknown[]) : [];
				// Each item is rendered with its own rules evaluated against its data
				// (on top of the outer form's), so the summary does the same.
				const itemEntries = items.map((item) => {
					const itemData = { ...data, ...(item && typeof item === "object" ? (item as Record<string, unknown>) : {}) };
					const itemOptions = { ...options, dynamicProps: computeDynamicProps(config.children, itemData, options.formContext) };
					return collectEntries(config.children, itemData, itemOptions);
				});
				if (items.length === 0 && !options.showEmpty) continue;
				entries.push({ kind: "row", id: config.id, label, display: displayValue(definition, config, value), items: itemEntries });
				continue;
			}
			const display = displayValue(definition, config, value);
			if (display === null && !options.showEmpty) continue;
			entries.push({ kind: "row", id: config.id, label, display });
			continue;
		}

		if (definition.kind === "layout") {
			const inner = collectEntries(config.children, data, options);
			if (inner.length === 0) continue;
			if (typeof config.title === "string" && config.title) {
				entries.push({ kind: "heading", title: config.title, description: typeof config.description === "string" ? config.description : undefined });
			}
			entries.push(...inner);
		}
	}
	return entries;
}

/**
 * Splits the form into review groups, one per page (or one group for a form
 * without pages). Review pages keep their index but contribute no entries.
 */
export function collectGroups(context: FormEngineContext, showEmpty: boolean): ReviewGroup[] {
	const root = context.schema;
	if (!root || !Array.isArray(root.children)) return [];
	const options: WalkOptions = { showEmpty, formContext: context.formContext ?? {}, dynamicProps: context.dynamicProps ?? {} };
	const groups: ReviewGroup[] = [];
	const loose: unknown[] = [];
	let pageIndex = 0;
	for (const child of root.children) {
		if (isPageNode(child)) {
			const page = child as { type: string; title?: string; children?: unknown[] };
			if (page.type !== REVIEW_PAGE_TYPE) {
				const resolved = resolveNode(child, context.formData, options);
				const entries = resolved ? collectEntries(page.children, context.formData, options) : [];
				if (entries.length) groups.push({ pageIndex, title: page.title, entries });
			}
			pageIndex += 1;
		} else {
			loose.push(child);
		}
	}
	const looseEntries = collectEntries(loose, context.formData, options);
	if (looseEntries.length) groups.push({ entries: looseEntries });
	return groups;
}
