"use client";

import React from "react";
import type { FormComponent } from "../services/schemaParser";
import { getComponent, type RegisteredComponentProps } from "./componentRegistry";

interface ComponentRendererBaseProps {
	component: FormComponent;
	formData: Record<string, any>;
	onFieldChange: (fieldId: string, value: any) => void;
}

export default function ComponentRenderer({
	component,
	formData,
	onFieldChange }: ComponentRendererBaseProps)
{
	const RegisteredReactComponent = getComponent(component.type);

	if (!RegisteredReactComponent) {
		console.warn(`No component registered for type: ${component.type}`);
		return (
			<div className="my-2 p-2 border border-red-300 bg-red-50 text-red-700 rounded-md">
				<p className="font-semibold">Unsupported Component Type</p>
				<p className="text-sm">No renderer registered for type:
					"{component.type}" (id: "{component.id}").</p>
			</div>
		);
	}

	// Prepare the props for the specific registered component
	const propsForRegisteredComponent: RegisteredComponentProps = {
		component, // Pass the specific component definition
		formData,
		onFieldChange,
	};

	return <RegisteredReactComponent {...propsForRegisteredComponent} />;
}
