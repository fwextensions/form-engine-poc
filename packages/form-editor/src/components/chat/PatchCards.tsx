"use client";

import type { PatchWithResult } from "./ValidationContext";
import type { PatchOp } from "@/lib/jsonl/types";
import { useFieldHighlight } from "./FieldHighlightContext";
import { getFieldIdFromPatch } from "@/lib/field-highlight";

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

function PatchCard({ patch, success, error, onHighlight }: PatchWithResult & { onHighlight?: (fieldId: string) => void }) {
	if (patch.op === "message") {
		return <p className="text-sm text-slate-700 py-1">{patch.text}</p>;
	}

	const style = OP_STYLES[patch.op];
	const title = opTitle(patch);
	const detail = opDetail(patch);
	const fieldId = getFieldIdFromPatch(patch);
	const isClickable = !!fieldId && !!onHighlight;

	const handleClick = () => {
		if (fieldId && onHighlight) onHighlight(fieldId);
	};

	return (
		<div
			className={`flex items-start gap-2 pl-3 pr-2 py-2 ${style.border} bg-white rounded-r-md ${isClickable ? "cursor-pointer hover:bg-slate-50 transition-colors" : ""}`}
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
			{success !== undefined && (
				<span className={`flex-shrink-0 text-sm font-semibold mt-0.5 ${success ? "text-green-600" : "text-red-500"}`}>
					{success ? "✓" : "✗"}
				</span>
			)}
		</div>
	);
}

export function PatchCards({ cards }: { cards: PatchWithResult[] }) {
	const onHighlight = useFieldHighlight();

	return (
		<div className="space-y-1.5">
			{cards.map((card, i) => (
				<PatchCard key={i} patch={card.patch} success={card.success} error={card.error} onHighlight={onHighlight ?? undefined} />
			))}
		</div>
	);
}
