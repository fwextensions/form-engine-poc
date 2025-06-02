// packages/form-engine/src/core/DynamicRenderer.tsx
import React from "react";
import { getComponentDefinition } from "./componentRegistryService";
import { FormEngineContext } from "./componentFactory";
import { evaluateCondition } from "../services/conditionLogic";

interface DynamicRendererProps {
	config: unknown;
	context: FormEngineContext;
	ErrorComponent?: React.ComponentType<{ error: string; componentType?: string }>;
}

const DefaultErrorComponent: React.FC<{ error: string; componentType?: string }> = ({ error, componentType }) => (
	<div style={{ color: "red", border: "1px solid red", padding: "8px", margin: "4px 0" }}>
		Error rendering {componentType ? `component "${componentType}"` : "component"}: {error}
	</div>
);

export const DynamicRenderer: React.FC<DynamicRendererProps> = ({
	config,
	context,
	ErrorComponent = DefaultErrorComponent,
}) => {
	if (!config || typeof config !== "object" || !("type" in config) || typeof (config as any).type !== "string") {
		return <ErrorComponent error="Invalid component configuration: missing or invalid 'type'." />;
	}

	const componentType = (config as { type: string }).type;

	try {
		const componentDef = getComponentDefinition(componentType);
		if (!componentDef) {
			return <ErrorComponent error={`Unknown component type: ${componentType}`} componentType={componentType} />;
		}

		const validatedConfig = componentDef.validateConfig(config);

		if (validatedConfig && typeof validatedConfig === "object" && "condition" in validatedConfig && (validatedConfig as any).condition !== undefined) {
			if (!evaluateCondition((validatedConfig as any).condition, context.formData, context.formContext)) {
				return null;
			}
		}

		const ComponentToRender = componentDef.component;

		const renderChildren = (childrenConfig: unknown[] | undefined, currentContext: FormEngineContext): React.ReactNode => {
			return childrenConfig?.map((childConfig: unknown, index: number) => (
				<DynamicRenderer key={index} config={childConfig} context={currentContext} ErrorComponent={ErrorComponent} />
			));
		};

		let props;
		if (componentDef.transformProps) {
			props = componentDef.transformProps(validatedConfig, context, (childConfigsToRender, childContext) => renderChildren(childConfigsToRender, childContext || context));
		} else {
			props = (validatedConfig as any).props || validatedConfig;
		}

		let childrenElements: React.ReactNode = null;
		if (componentDef.transformProps) {
			// transformProps handles children rendering via renderChildren callback
		} else if (validatedConfig && typeof validatedConfig === "object" && "children" in validatedConfig && Array.isArray((validatedConfig as any).children)) {
			childrenElements = renderChildren((validatedConfig as any).children, context);
		}

		return (
			<ComponentToRender {...props}>
				{childrenElements && !componentDef.transformProps ? childrenElements : undefined}
			</ComponentToRender>
		);

	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Unknown error";
		return <ErrorComponent error={errorMessage} componentType={componentType} />;
	}
};
