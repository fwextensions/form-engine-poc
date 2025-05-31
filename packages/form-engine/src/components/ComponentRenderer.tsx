"use client";

import React from "react";
import { apply as applyJsonLogic } from "json-logic-js";
import type { FormComponent, JsonLogicRule } from "../services/schemaParser";
import { getComponent, type RegisteredComponentProps } from "./componentRegistry";

interface ComponentRendererBaseProps {
	component: FormComponent;
	formData: Record<string, any>;
	context?: Record<string, any>;
	onFieldChange: (fieldId: string, value: any) => void;
}

export default function ComponentRenderer({
	component,
	formData,
	context = {}, // Default to empty object if not provided
	onFieldChange,
}: ComponentRendererBaseProps) {
	// Evaluate condition if it exists
	if (component.condition) {
		const dataForLogic = {
			data: formData,
			context,
			// Potentially add other relevant data sources here, e.g., user info
		};
		// Ensure all parts of the dataForLogic are serializable if JSON Logic expects pure JSON
		// For json-logic-js, direct object access should work.
		try {
			const conditionResult = applyJsonLogic(component.condition as JsonLogicRule, dataForLogic);

			if (!conditionResult) {
				return null; // Don't render if condition is falsy
			}
		} catch (error) {
			console.error(
				`Error evaluating JSON Logic condition for component "${component.id}":`,
				error,
				"Condition:", component.condition,
				"Data:", dataForLogic
			);
			// Optionally, render an error message or fallback UI
			return (
				<div className="my-2 p-2 border border-orange-300 bg-orange-50 text-orange-700 rounded-md">
					<p className="font-semibold">Condition Error</p>
					<p className="text-sm">Error evaluating display condition for component: "{component.id}".</p>
				</div>
			);
		}
	}

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
		context,
		onFieldChange,
	};

	return <RegisteredReactComponent {...propsForRegisteredComponent} />;
}
