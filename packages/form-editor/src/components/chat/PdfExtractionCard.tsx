"use client";

import { useState } from "react";
import type { PdfExtractionResult } from "@/lib/pdf-extraction";

interface PdfExtractionCardProps {
	result: PdfExtractionResult;
	filename: string;
}

export function PdfExtractionCard({ result, filename }: PdfExtractionCardProps) {
	const [expanded, setExpanded] = useState(false);

	const totalFields = result.sections.reduce((n, s) => n + s.fields.length, 0);
	const sectionCount = result.sections.length;

	return (
		<div className="border-l-3 bg-[#fcfcfc] border-t border-r border-b border-ink-100 rounded-md shadow-sm overflow-hidden mt-1"
			style={{ borderLeftColor: "var(--color-primary-400)" }}
		>
			<div className="flex items-start gap-2 pl-3 pr-2 py-2">
				{/* PDF icon */}
				<span className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded shrink-0 bg-primary-100 text-primary-700">
					PDF
				</span>
				<div className="flex-1 min-w-0 text-sm">
					<p className="font-medium text-ink-800 leading-tight truncate">
						{filename}
					</p>
					<p className="text-xs text-ink-500 mt-0.5 leading-tight">
						{totalFields} field{totalFields !== 1 ? "s" : ""} extracted
						{sectionCount > 1 ? ` across ${sectionCount} sections` : ""}
						{result.formTitle ? ` · ${result.formTitle}` : ""}
					</p>
				</div>
				<button
					onClick={() => setExpanded((v) => !v)}
					className="font-mono font-bold text-xs text-ink-300 hover:text-ink-600 transition-colors p-1 pt-0.5 rounded hover:bg-ink-50 shrink-0"
					title="Show extraction JSON"
				>
					{"{}"}
				</button>
			</div>
			{expanded && (
				<pre className="text-xs text-ink-600 bg-ink-50/50 border-t border-ink-100 px-3 py-2 overflow-x-auto max-h-96">
					{JSON.stringify(result, null, 2)}
				</pre>
			)}
		</div>
	);
}
