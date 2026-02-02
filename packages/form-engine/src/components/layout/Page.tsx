// packages/form-engine/src/components/layout/Page.tsx
import React from "react";
import { createComponent } from "../../core/componentFactory";
import { FormEngineContext } from "../../engine/FormEngineContext";
// Import the catalog entry - schema comes from here
import { pageEntry, type PageConfig } from "../../catalog/entries/page";

// Re-export the config type for external consumers
export type { PageConfig } from "../../catalog/entries/page";

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

// 4. Register the Component using catalog entry
createComponent<PageConfig, PageProps>({
	type: "page",
	catalogEntry: pageEntry,
	component: PageComponent,
	transformProps: (config: PageConfig, context: FormEngineContext, renderChildren): PageProps => {
		const { id, children, title, className, style } = config;

		return {
			id,
			title,
			className,
			style,
			children: renderChildren(children, context), // Call renderChildren and pass its result
		};
	},
});
