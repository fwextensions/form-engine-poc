"use client";

import React from "react";
import type { FormPage, FormComponent } from "../../services/schemaParser"; 
import ComponentRenderer from "../ComponentRenderer";
import type { RegisteredComponentProps } from "../componentRegistry";

// PageRenderer now directly uses RegisteredComponentProps
const PageRenderer: React.FC<RegisteredComponentProps> = ({
	component,
	formData,
	onFieldChange,
}) => {
	// Type guard to ensure the component is a FormPage
	if (component.type !== "page") {
		// This case should ideally not be reached if the schema and registry are correct
		console.error("PageRenderer received a component that is not a page:", component);
		return null; // Or render an error message
	}

	// Now TypeScript knows 'component' is FormPage within this block
	const pageComponent = component as FormPage;

	return (
		<div className="page-container my-6 p-6 bg-slate-50 border border-slate-200 rounded-lg shadow-sm">
			{pageComponent.title && (
				<h2 className="text-2xl font-bold text-slate-700 mb-6 pb-2 border-b border-slate-300">
					{pageComponent.title}
				</h2>
			)}
			{pageComponent.children.map((childComponent: FormComponent) => (
				<ComponentRenderer
					key={childComponent.id} // Ensure unique keys
					component={childComponent} // childComponent is a FormComponent
					formData={formData}
					onFieldChange={onFieldChange}
				/>
			))}
		</div>
	);
};

export default PageRenderer;
