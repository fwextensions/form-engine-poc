import React from "react";

const svgProps = {
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	strokeWidth: 2,
	strokeLinecap: "round" as const,
	strokeLinejoin: "round" as const,
	className: "h-4 w-4",
	"aria-hidden": true as const,
};

export const ChevronLeftIcon = () => (
	<svg {...svgProps}>
		<path d="m15 18-6-6 6-6" />
	</svg>
);

export const ChevronRightIcon = () => (
	<svg {...svgProps}>
		<path d="m9 18 6-6-6-6" />
	</svg>
);

export const UndoIcon = () => (
	<svg {...svgProps}>
		<path d="M9 14 4 9l5-5" />
		<path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
	</svg>
);

export const RedoIcon = () => (
	<svg {...svgProps}>
		<path d="m15 14 5-5-5-5" />
		<path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />
	</svg>
);

export const PlusIcon = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden={true}>
		<line x1="12" y1="5" x2="12" y2="19" />
		<line x1="5" y1="12" x2="19" y2="12" />
	</svg>
);

export const TrashIcon = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden={true}>
		<polyline points="3 6 5 6 21 6" />
		<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
		<path d="M10 11v6" />
		<path d="M14 11v6" />
		<path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
	</svg>
);
