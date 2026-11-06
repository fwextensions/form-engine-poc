// packages/form-engine/src/components/layout/Review.tsx
// A read-only summary of everything entered so far, for the last step of a
// multi-page form. It walks the form config from the engine context, so it
// needs no configuration of its own: every visible field is listed under its
// page (and section) heading, with an "Edit" link back to the page.
import React from "react";
import { z } from "zod";
import { baseComponentConfigSchema } from "../../core/baseSchemas";
import { createComponent, getComponentDefinition, type ComponentDefinition } from "../../core/componentFactory";
import { evaluateCondition } from "../../core/conditionLogic";
import { deepMerge } from "../../utils/deepMerge";
import { useFormEngine, type FormEngineContext } from "../../engine/FormEngineContext";
import { computeDynamicProps } from "../../hooks/useFormRules";

export const ReviewConfigSchema = baseComponentConfigSchema.extend({
	type: z.literal("review"),
	title: z.string().optional().describe("Heading shown above the summary"),
	description: z.string().optional().describe("Text shown under the heading"),
	emptyText: z.string().optional().default("Not answered").describe("Shown for fields with no value"),
	showEmpty: z.boolean().optional().default(true).describe("Include fields that have no value"),
	editLinks: z.boolean().optional().default(true).describe("Show an Edit link per page (multi-page forms only)"),
	editLinkText: z.string().optional().default("Edit"),
	className: z.string().optional(),
});
export type ReviewConfig = z.infer<typeof ReviewConfigSchema>;

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

interface WalkOptions {
	showEmpty: boolean;
	formContext: Record<string, unknown>;
	dynamicProps: Record<string, Record<string, unknown>>;
}

/** The config the renderer would use: lenient-checked, with dynamic props merged; null when hidden or unusable. */
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
		if (definition.type === "review") continue;

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

/** Splits the form into review groups, one per page (or one group for a form without pages). */
export function collectGroups(context: FormEngineContext, showEmpty: boolean): ReviewGroup[] {
	const root = context.schema;
	if (!root || !Array.isArray(root.children)) return [];
	const options: WalkOptions = { showEmpty, formContext: context.formContext ?? {}, dynamicProps: context.dynamicProps ?? {} };
	const groups: ReviewGroup[] = [];
	const loose: unknown[] = [];
	let pageIndex = 0;
	for (const child of root.children) {
		if (child && typeof child === "object" && (child as { type?: string }).type === "page") {
			const page = child as { title?: string; children?: unknown[] };
			const resolved = resolveNode(child, context.formData, options);
			const entries = resolved ? collectEntries(page.children, context.formData, options) : [];
			if (entries.length) groups.push({ pageIndex, title: page.title, entries });
			pageIndex += 1;
		} else {
			loose.push(child);
		}
	}
	const looseEntries = collectEntries(loose, context.formData, options);
	if (looseEntries.length) groups.push({ entries: looseEntries });
	return groups;
}

export interface ReviewProps {
	config: ReviewConfig;
}

function Rows({ entries, emptyText }: { entries: ReviewEntry[]; emptyText: string }) {
	return (
		<dl className="divide-y divide-ink-100">
			{entries.map((entry, i) =>
				entry.kind === "heading" ? (
					<div key={`h-${i}`} className="pt-4 pb-1">
						<h4 className="text-sm font-semibold text-ink-800">{entry.title}</h4>
						{entry.description && <p className="text-xs text-ink-500">{entry.description}</p>}
					</div>
				) : (
					<div key={entry.id} data-review-field={entry.id} className="py-2 grid gap-1 sm:grid-cols-3">
						<dt className="text-sm text-ink-600">{entry.label}</dt>
						<dd className="text-sm text-ink-900 sm:col-span-2">
							{entry.items ? (
								entry.items.length === 0 ? (
									<span className="text-ink-400 italic">{emptyText}</span>
								) : (
									<ol className="space-y-3 list-none">
										{entry.items.map((item, j) => (
											<li key={j} className="rounded border border-ink-100 px-3 py-1">
												<Rows entries={item} emptyText={emptyText} />
											</li>
										))}
									</ol>
								)
							) : entry.display === null ? (
								<span className="text-ink-400 italic">{emptyText}</span>
							) : (
								entry.display
							)}
						</dd>
					</div>
				),
			)}
		</dl>
	);
}

export const ReviewComponent: React.FC<ReviewProps> = ({ config }) => {
	const context = useFormEngine();
	const groups = collectGroups(context, config.showEmpty ?? true);
	const canEdit = (config.editLinks ?? true) && context.isMultiPage && context.formMode !== "view" && typeof context.onNavigateTo === "function";
	const emptyText = config.emptyText ?? "Not answered";

	return (
		<div id={config.id} data-review className={`form-review ${config.className ?? ""}`}>
			{config.title && <h3 className="text-base font-semibold text-ink-800 mb-1">{config.title}</h3>}
			{config.description && <p className="text-sm text-ink-600 mb-3">{config.description}</p>}
			{groups.length === 0 && <p className="text-sm text-ink-500 italic">Nothing to review yet.</p>}
			{groups.map((group, i) => (
				<section key={group.pageIndex ?? `loose-${i}`} data-review-page={group.pageIndex} className="mb-6">
					{(group.title || canEdit) && (
						<div className="flex items-baseline justify-between border-b border-ink-200 pb-1 mb-1">
							<h4 className="text-sm font-semibold text-ink-700">{group.title ?? (group.pageIndex !== undefined ? `Page ${group.pageIndex + 1}` : "")}</h4>
							{canEdit && group.pageIndex !== undefined && (
								<button type="button" onClick={() => context.onNavigateTo?.(group.pageIndex!)} className="text-sm text-primary-700 hover:underline" aria-label={`${config.editLinkText ?? "Edit"} ${group.title ?? `page ${group.pageIndex + 1}`}`}>
									{config.editLinkText ?? "Edit"}
								</button>
							)}
						</div>
					)}
					<Rows entries={group.entries} emptyText={emptyText} />
				</section>
			))}
		</div>
	);
};

createComponent<ReviewConfig, ReviewProps>({
	type: "review",
	kind: "static",
	schema: ReviewConfigSchema,
	component: ReviewComponent,
	description: "A read-only summary of every answer entered so far, grouped by page, with Edit links back to each page; place it on the last page of a multi-page form",
	example: { id: "reviewAnswers", title: "Review your answers", description: "Check everything before you submit." },
	notes: "The review needs no list of fields: it reads the form config and shows every visible field with a value (or \"Not answered\"). Put it in its own final page so the submit button follows it.",
	transformProps: (config) => ({ config }),
});
