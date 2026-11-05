// packages/form-engine/src/components/fields/icons.tsx
// The three glyphs the field controls need, inline so the engine carries no icon dependency.
import React from "react";

type IconProps = React.SVGProps<SVGSVGElement>;

const base: IconProps = { width: 15, height: 15, viewBox: "0 0 15 15", fill: "none", "aria-hidden": true, focusable: false };

export const CheckIcon: React.FC<IconProps> = (props) => (
	<svg {...base} {...props}>
		<path d="M11.47 3.97 6 9.44 3.53 6.97a.75.75 0 1 0-1.06 1.06l3 3a.75.75 0 0 0 1.06 0l6-6a.75.75 0 0 0-1.06-1.06Z" fill="currentColor" />
	</svg>
);

export const ChevronDownIcon: React.FC<IconProps> = (props) => (
	<svg {...base} {...props}>
		<path d="M3.47 5.47a.75.75 0 0 1 1.06 0L7.5 8.44l2.97-2.97a.75.75 0 1 1 1.06 1.06l-3.5 3.5a.75.75 0 0 1-1.06 0l-3.5-3.5a.75.75 0 0 1 0-1.06Z" fill="currentColor" />
	</svg>
);

export const ChevronUpIcon: React.FC<IconProps> = (props) => (
	<svg {...base} {...props}>
		<path d="M3.47 9.53a.75.75 0 0 0 1.06 0L7.5 6.56l2.97 2.97a.75.75 0 1 0 1.06-1.06l-3.5-3.5a.75.75 0 0 0-1.06 0l-3.5 3.5a.75.75 0 0 0 0 1.06Z" fill="currentColor" />
	</svg>
);
