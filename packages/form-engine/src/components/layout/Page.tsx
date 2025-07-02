// packages/form-engine/src/components/layout/Page.tsx
import React from "react";
import { z } from "zod";
import { baseLayoutComponentConfigSchema } from "../../core/baseSchemas";
import { createComponent } from "../../core/componentFactory";
import { FormEngineContext } from "../core/FormEngineContext";

// 1. Define Configuration Schema
export const PageConfigSchema = baseLayoutComponentConfigSchema.extend({
	type: z.literal("page"),
	title: z.string().optional(),
	className: z.string().optional(),
	style: z.record(z.string(), z.any()).optional(), // Allows for a basic style object
});
export type PageConfig = z.infer<typeof PageConfigSchema>;

// 2. Define Props for the React Component
export interface PageProps extends React.HTMLAttributes<HTMLDivElement> {
	title?: string;
	children?: React.ReactNode; // Rendered children will be passed by DynamicRenderer
}

// 3. Create the React Component
export const PageComponent: React.FC<PageProps> = ({ title, children, className, style, ...rest }) => {
	return (
		<div
			{...rest} // Passes through other HTML attributes like id
			className={`page-container p-4 border border-gray-200 rounded-md shadow-sm my-4 ${className || ''}`}
			style={style}
		>
			{title && <h2 className="text-xl font-semibold mb-3 border-b pb-2 text-gray-700">{title}</h2>}
			<div className="page-content space-y-4">
				{children}
			</div>
		</div>
	);
};

// 4. Register the Component
createComponent<PageConfig, PageProps>({
	type: "page",
	schema: PageConfigSchema,
	component: PageComponent, // The actual React component to render
	transformProps: (config: PageConfig, context: FormEngineContext, renderChildren): PageProps => {
		const { id, children, title, className, style } = config;

		return {
			id,
			title,
			className,
			style,
			children: renderChildren(children, context), // Call renderChildren and pass its result
			// any other props derived from restOfConfig can be added here if PageProps supports them
		};
	},
});
