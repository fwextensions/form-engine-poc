// packages/form-engine/src/components/layout/ReviewPage.tsx
// The last step of a multi-page form: a page that shows a read-only summary
// of every answer so far, grouped by page with Edit links, plus any children
// of its own (intro text before the summary, or a certification checkbox
// after it). It walks the form config from the engine context, so it needs
// no list of fields.
import React from "react";
import { z } from "zod";
import { baseLayoutComponentConfigSchema } from "../../core/baseSchemas";
import { createComponent } from "../../core/componentFactory";
import { useFormEngine, type FormEngineContext } from "../../engine/FormEngineContext";
import { PageComponent } from "./Page";
import { collectGroups, REVIEW_PAGE_TYPE, type ReviewEntry } from "./reviewSummary";

export const ReviewPageConfigSchema = baseLayoutComponentConfigSchema.extend({
	type: z.literal(REVIEW_PAGE_TYPE),
	title: z.string().optional().describe("Page heading"),
	description: z.string().optional().describe("Text shown above the summary"),
	summaryPlacement: z.enum(["start", "end"]).optional().default("end").describe("Where the summary goes relative to this page's own children: after them (default) or before them"),
	showEmpty: z.boolean().optional().default(true).describe("Include fields that have no value"),
	emptyText: z.string().optional().default("Not answered").describe("Shown for fields with no value"),
	editLinks: z.boolean().optional().default(true).describe("Show an Edit link per page"),
	editLinkText: z.string().optional().default("Edit"),
	className: z.string().optional(),
	style: z.record(z.string(), z.any()).optional(),
});
export type ReviewPageConfig = z.infer<typeof ReviewPageConfigSchema>;

export interface ReviewPageProps {
	config: ReviewPageConfig;
	children?: React.ReactNode;
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

/** The summary itself: one section per page with answers. */
export function ReviewSummary({ config }: { config: ReviewPageConfig }) {
	const context = useFormEngine();
	const groups = collectGroups(context, config.showEmpty ?? true);
	const canEdit = (config.editLinks ?? true) && context.isMultiPage && context.formMode !== "view" && typeof context.onNavigateTo === "function";
	const emptyText = config.emptyText ?? "Not answered";

	return (
		<div data-review className="form-review">
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
}

export const ReviewPageComponent: React.FC<ReviewPageProps> = ({ config, children }) => {
	const summary = <ReviewSummary config={config} />;
	const summaryFirst = config.summaryPlacement === "start";
	return (
		<PageComponent id={config.id} title={config.title} className={`review-page ${config.className ?? ""}`} style={config.style}>
			{summaryFirst && summary}
			{children}
			{!summaryFirst && summary}
		</PageComponent>
	);
};

createComponent<ReviewPageConfig, ReviewPageProps>({
	type: REVIEW_PAGE_TYPE,
	kind: "layout",
	schema: ReviewPageConfigSchema,
	component: ReviewPageComponent,
	description: "The last page of a multi-page form: a read-only summary of every answer so far, grouped by page with Edit links, plus any children of its own",
	example: { id: "review", title: "Review your answers", description: "Check everything before you submit." },
	notes: "Use `reviewPage` instead of `page` for the final step; it needs no list of fields. Its own children render before the summary (set `summaryPlacement: start` to put them after it, e.g. a certification checkbox) and are not included in the summary.",
	children: { allow: "any", deny: ["form", "page", "reviewPage"] },
	isPage: true,
	transformProps: (config, context: FormEngineContext, renderChildren) => ({
		config,
		children: renderChildren(config.children, context),
	}),
});
