import React from "react";
import type { FormPage, FormComponent } from "../../services/schemaParser";
import ComponentRenderer from "../ComponentRenderer";
import type { RegisteredComponentProps } from "../componentRegistry";

export default function PageRenderer({
	component,
	formData,
	onFieldChange,
	context,
}: RegisteredComponentProps)
{
	// Type guard to ensure the component is a FormPage
	if (component.type !== "page") {
		// This case should ideally not be reached if the schema and registry are correct
		console.error("PageRenderer received a component that is not a page:",
			component);
		return null; // Or render an error message
	}

	const { title, children } = component as FormPage;

	return (
		<div className="page-container my-6 p-6 bg-slate-50 border border-slate-200 rounded-lg shadow-sm">
			{title && (
				<h2 className="text-2xl font-bold text-slate-700 mb-6 pb-2 border-b border-slate-300">
					{title}
				</h2>
			)}
			{children.map((childComponent: FormComponent, i) => (
				<ComponentRenderer
					key={childComponent.id || `${childComponent.type}-${i}`} // Ensure unique keys
					component={childComponent}
					formData={formData}
					onFieldChange={onFieldChange}
					context={context}
				/>
			))}
		</div>
	);
}
