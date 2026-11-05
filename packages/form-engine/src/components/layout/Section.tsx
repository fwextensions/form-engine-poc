// packages/form-engine/src/components/layout/Section.tsx
// Groups related fields under a heading with optional help text, inside a page.
import React from "react";
import { z } from "zod";
import { baseLayoutComponentConfigSchema } from "../../core/baseSchemas";
import { createComponent } from "../../core/componentFactory";
import type { FormEngineContext } from "../../engine/FormEngineContext";

export const SectionConfigSchema = baseLayoutComponentConfigSchema.extend({
	type: z.literal("section"),
	title: z.string().optional().describe("Heading shown above the group"),
	description: z.string().optional().describe("Help text shown under the heading"),
	className: z.string().optional(),
});
export type SectionConfig = z.infer<typeof SectionConfigSchema>;

export interface SectionProps {
	id?: string;
	title?: string;
	description?: string;
	className?: string;
	children?: React.ReactNode;
}

export const SectionComponent: React.FC<SectionProps> = ({ id, title, description, className, children }) => {
	const headingId = id ? `${id}-heading` : undefined;
	const descriptionId = id && description ? `${id}-description` : undefined;
	return (
		<section
			id={id}
			aria-labelledby={headingId}
			aria-describedby={descriptionId}
			className={`form-section mb-6 ${className ?? ""}`}
		>
			{title && (
				<h3 id={headingId} className="text-base font-semibold text-ink-800 mb-1">
					{title}
				</h3>
			)}
			{description && (
				<p id={descriptionId} className="text-sm text-ink-600 mb-3">
					{description}
				</p>
			)}
			<div className="space-y-4">{children}</div>
		</section>
	);
};

createComponent<SectionConfig, SectionProps>({
	type: "section",
	kind: "layout",
	schema: SectionConfigSchema,
	component: SectionComponent,
	description: "Groups related fields under a heading with optional help text, within a page",
	example: { id: "yourName", title: "Your name", description: "Enter your name as it appears on your ID.", children: [] },
	notes: "Use a section when a paper form has a labelled block of related fields (\"YOUR ADDRESS\", \"ALTERNATE CONTACT\"). Sections live inside pages and may be nested.",
	children: { allow: "any", deny: ["form", "page"] },
	transformProps: (config: SectionConfig, context: FormEngineContext, renderChildren): SectionProps => ({
		id: config.id,
		title: config.title,
		description: config.description,
		className: config.className,
		children: renderChildren(config.children, context),
	}),
});
