"use client";

import { useState } from "react";
import { Streamdown } from "streamdown";
import type { PatchWithResult } from "./ValidationContext";
import type { PatchOp } from "@/lib/jsonl/types";
import { useFieldHighlight, type FieldHighlightFn } from "./FieldHighlightContext";
import { getHighlightTarget } from "@/lib/field-highlight";

type OpStyle = {
	badge: string;
	border: string;
};

const OP_STYLES: Record<string, OpStyle> = {
	add:     { badge: "bg-green-100 text-green-800",   border: "border-l-2 border-green-400" },
	update:  { badge: "bg-blue-100 text-blue-800",     border: "border-l-2 border-blue-400" },
	remove:  { badge: "bg-red-100 text-red-800",       border: "border-l-2 border-red-400" },
	move:    { badge: "bg-indigo-100 text-indigo-800", border: "border-l-2 border-indigo-400" },
	replace: { badge: "bg-amber-100 text-amber-800",   border: "border-l-2 border-amber-400" },
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
			<div className="text-sm text-slate-700 py-1">
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
		<div className={`${style.border} bg-white rounded-r-md overflow-hidden`}>
			<div
				className={`flex items-start gap-2 pl-3 pr-2 py-2 ${isClickable ? "cursor-pointer hover:bg-slate-50 transition-colors" : ""}`}
				onClick={isClickable ? handleClick : undefined}
				role={isClickable ? "button" : undefined}
				tabIndex={isClickable ? 0 : undefined}
				onKeyDown={isClickable ? (e) => { if (e.key === "Enter" || e.key === " ") handleClick(); } : undefined}
			>
				<span className={`font-mono text-xs font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${style.badge}`}>
					{patch.op.toUpperCase()}
				</span>
				<div className="flex-1 min-w-0 text-sm">
					<p className="font-medium text-slate-900 leading-tight">{title}</p>
					{detail && (
						<p className="text-xs text-slate-500 mt-0.5 leading-tight">{detail}</p>
					)}
					{error && (
						<p className="text-xs text-red-600 mt-1 leading-tight">{error}</p>
					)}
				</div>
				<div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
					{success !== undefined && (
						<span className={`text-sm font-semibold ${success ? "text-green-600" : "text-red-500"}`}>
							{success ? "✓" : "✗"}
						</span>
					)}
					<button
						onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
						className="font-mono text-xs text-slate-400 hover:text-slate-600 transition-colors px-1 rounded hover:bg-slate-100"
						title="Show raw JSON"
					>
						{"{}"}
					</button>
				</div>
			</div>
			{expanded && (
				<pre className="text-xs text-slate-600 bg-slate-50 border-t border-slate-100 px-3 py-2 overflow-x-auto">
					{JSON.stringify(patch, null, 2)}
				</pre>
			)}
		</div>
	);
}

export function PatchCards({ cards }: { cards: PatchWithResult[] }) {
	const onHighlight = useFieldHighlight();

	return (
		<div className="space-y-1.5">
			{cards.map((card, i) => (
				<PatchCard key={i} card={card} onHighlight={onHighlight ?? undefined} />
			))}
		</div>
	);
}
