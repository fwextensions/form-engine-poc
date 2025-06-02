// packages/form-engine/src/components/layout/Page.tsx
import React from "react";
import { z } from "zod";
import { baseLayoutComponentConfigSchema } from "../baseSchemas";
import { createComponent, FormEngineContext } from "../../core/componentFactory";

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
createComponent<PageConfig, Omit<PageProps, 'children'>>({
	type: "page",
	schema: PageConfigSchema,
	component: PageComponent, // The actual React component to render
	transformProps: (config: PageConfig, context: FormEngineContext): Omit<PageProps, 'children'> => {
		const { id, type, condition, children, title, className, style, ...restOfConfig } = config;
		// DynamicRenderer will handle rendering 'children' from the config
		// and pass them as a 'children' prop to PageComponent.
		// This transformProps maps other config values to PageComponent's props.
		return {
			id,
			title,
			className,
			style,
			// any other props derived from restOfConfig can be added here if PageProps supports them
		};
	},
});
