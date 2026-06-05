"use client";

import { useState } from "react";
import { Streamdown } from "streamdown";
import type { PatchWithResult } from "./ValidationContext";
import type { PatchOp } from "@/lib/jsonl/types";
import { useFieldHighlight, type FieldHighlightFn } from "./FieldHighlightContext";
import { getHighlightTarget } from "@/lib/field-highlight";
import { ChevronUpIcon, ChevronDownIcon } from "@/components/icons";

type OpStyle = {
	badge: string;
	border: string;
};

const OP_STYLES: Record<string, OpStyle> = {
	add:     { badge: "bg-success-100 text-success-700",     border: "border-l-3 border-success-500" },
	update:  { badge: "bg-primary-100 text-primary-700",     border: "border-l-3 border-primary-400" },
	remove:  { badge: "bg-danger-100 text-danger-700",       border: "border-l-3 border-danger-500" },
	move:    { badge: "bg-secondary-100 text-secondary-700", border: "border-l-3 border-secondary-500" },
	replace: { badge: "bg-accent-100 text-accent-700",       border: "border-l-3 border-accent-500" },
};

function opTitle(patch: PatchOp): string {
	switch (patch.op) {
		case "add":
			return `Added ${patch.component.type}${patch.component.id ? ` · ${patch.component.id}` : ""}`;
		case "update":
			return `Updated ${patch.id}`;
		case "remove":
			return `Removed ${patch.id}`;
		case "move":
			return `Moved ${patch.id}`;
		case "replace":
			return "Replaced full schema";
		case "message":
			return patch.text;
	}
}

function opDetail(patch: PatchOp): string | null {
	switch (patch.op) {
		case "add":
			return `into ${patch.parentId}`;
		case "update": {
			const keys = Object.keys(patch.props).filter((k) => k !== "children");
			return keys.length ? keys.join(", ") : null;
		}
		case "move":
			return `to ${patch.parentId}`;
		default:
			return null;
	}
}

function PatchCard({ card, onHighlight }: { card: PatchWithResult; onHighlight?: FieldHighlightFn }) {
	const { patch, success, error } = card;
	const [expanded, setExpanded] = useState(false);

	if (patch.op === "message") {
		return (
			<div className="text-sm text-ink-700 py-1">
				<Streamdown mode="static">{patch.text}</Streamdown>
			</div>
		);
	}

	const style = OP_STYLES[patch.op];
	const title = opTitle(patch);
	const detail = opDetail(patch);
	const target = getHighlightTarget(card);
	const isClickable = !!target && !!onHighlight;

	const handleClick = () => {
		if (target && onHighlight) onHighlight(target.fieldId, target.edge);
	};

	return (
		<div className={`${style.border} bg-[#fcfcfc] border border-ink-100 rounded-md shadow-sm overflow-hidden`}>
			<div
				className={`flex items-start gap-2 pl-3 pr-2 py-2 ${isClickable ? "cursor-pointer hover:bg-ink-50/50 transition-colors" : ""}`}
				onClick={isClickable ? handleClick : undefined}
				role={isClickable ? "button" : undefined}
				tabIndex={isClickable ? 0 : undefined}
				onKeyDown={isClickable ? (e) => { if (e.key === "Enter" || e.key === " ") handleClick(); } : undefined}
			>
				<span className={`font-mono text-xs font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${style.badge}`}>
					{patch.op.toUpperCase()}
				</span>
				<div className="flex-1 min-w-0 text-sm">
					<p className="font-medium text-ink-800 leading-tight">{title}</p>
					{detail && (
						<p className="text-xs text-ink-500 mt-0.5 leading-tight">{detail}</p>
					)}
					{error && (
						<p className="text-xs text-danger-600 mt-1 leading-tight">{error}</p>
					)}
				</div>
				<div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
					{success !== undefined && (
						<span className={`text-sm font-semibold ${success ? "text-success-600" : "text-danger-500"}`}>
							{success ? "✓" : "✗"}
						</span>
					)}
					<button
						onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
						className="font-mono font-bold text-xs text-ink-300 hover:text-ink-600 transition-colors p-1 pt-0.5 rounded hover:bg-ink-50"
						title="Show raw JSON"
					>
						{"{}"}
					</button>
				</div>
			</div>
			{expanded && (
				<pre className="text-xs text-ink-600 bg-ink-50/50 border-t border-ink-100 px-3 py-2 overflow-x-auto">
					{JSON.stringify(patch, null, 2)}
				</pre>
			)}
		</div>
	);
}

const INITIAL_VISIBLE = 3;

export function PatchCards({ cards }: { cards: PatchWithResult[] }) {
	const onHighlight = useFieldHighlight();
	const [showAll, setShowAll] = useState(false);

	// Split message ops (summary text) from patch op cards
	const opCards = cards.filter((c) => c.patch.op !== "message");
	const messageCards = cards.filter((c) => c.patch.op === "message");

	const visibleOpCards = showAll
		? opCards
		: opCards.length <= INITIAL_VISIBLE + 1
				// only show the toggle if there are at least 2 more cards to show
			? opCards
			: opCards.slice(0, INITIAL_VISIBLE);
	const hiddenCount = opCards.length - visibleOpCards.length;

	return (
		<div className="space-y-1.5">
			{visibleOpCards.map((card, i) => (
				<PatchCard key={i} card={card} onHighlight={onHighlight ?? undefined} />
			))}
			{hiddenCount > 1 && (
				<button
					onClick={() => setShowAll((v) => !v)}
					className="flex items-center gap-1 text-xs text-ink-500 hover:text-ink-700 py-1.5 px-2 rounded hover:bg-ink-100 transition-colors cursor-pointer"
				>
					{showAll ? <ChevronUpIcon /> : <ChevronDownIcon />}
					{showAll
						? "Show fewer"
						: `Show ${hiddenCount} more`}
				</button>
			)}
			{messageCards.map((card, i) => (
				<PatchCard key={`msg-${i}`} card={card} onHighlight={onHighlight ?? undefined} />
			))}
		</div>
	);
}
