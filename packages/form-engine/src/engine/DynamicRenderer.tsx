// packages/form-engine/src/core/DynamicRenderer.tsx
import React from "react";
import { ZodError } from "zod";
import { getComponentDefinition } from "../core/componentFactory";
import { FormEngineContext } from "./FormEngineContext";
import { evaluateCondition } from "../core/conditionLogic";

// Default Error Component
const DefaultErrorComponent: React.FC<{ error: Error; config: unknown }> = ({ error, config }) => (
	<div style={{ color: "red", border: "1px solid red", padding: "10px", margin: "5px 0" }}>
		<p>Error rendering component:</p>
		<pre>{error.message}</pre>
		<p>Config:</p>
		<pre>{JSON.stringify(config, null, 2)}</pre>
	</div>
);

export interface DynamicRendererProps {
	config: unknown;
	context: FormEngineContext;
	ErrorComponent?: React.FC<{ error: Error; config: unknown }>;
}

export const DynamicRenderer: React.FC<DynamicRendererProps> = ({ config, context, ErrorComponent = DefaultErrorComponent }) => {
	const currentConfigTypeForLog = (config as any)?.type ?? 'unknown_config_type';

	if (!config || typeof config !== "object" || !("type" in config) || typeof config.type !== "string") {
		console.error(`DynamicRenderer (config type: ${currentConfigTypeForLog}): Invalid or missing component configuration or type.`, config);
		return <ErrorComponent error={new Error("Invalid component configuration or missing type.")} config={config} />;
	}

	const componentType = config.type;

	try {
		const componentDef = getComponentDefinition(componentType);
		if (!componentDef) {
			const error = new Error(`Component type "${componentType}" not registered.`);
			console.error(`DynamicRenderer for '${componentType}': ${error.message}`);
			return <ErrorComponent error={error} config={config} />;
		}

		// Use validateConfig to ensure transforms are applied before parsing
		let validatedConfig = componentDef.validateConfig(config);

		// --- START: Merge dynamic props from rules engine ---
		const componentId = (validatedConfig as any)?.id;

		if (context?.dynamicProps?.[componentId]) {
			const dynamicPropsForComponent = context.dynamicProps[componentId];

			// Merge dynamic props. Dynamic props take precedence.
			validatedConfig = {
				...validatedConfig,
				...dynamicPropsForComponent,
			};
		}
		// --- END: Merge dynamic props ---

		if (validatedConfig.hidden || validatedConfig.condition && !evaluateCondition(validatedConfig.condition, context.formData, context)) {
//			console.log(`DynamicRenderer for '${componentType}': Condition not met, rendering null.`);
			return null;
		}

		const ComponentToRender = componentDef.component;

		const renderChildrenCallback = (childrenConfig: unknown[] | undefined, currentContext: FormEngineContext): React.ReactNode =>
			childrenConfig?.map((childConfig: unknown, index: number) =>
				<DynamicRenderer key={index} config={childConfig} context={currentContext} ErrorComponent={ErrorComponent} />
			);

		let props: any;

		if (componentDef.transformProps) {
			props = componentDef.transformProps(validatedConfig, context, renderChildrenCallback);
		} else {
			props = (validatedConfig as any).props || validatedConfig;

			if (validatedConfig && typeof validatedConfig === "object" && "children" in validatedConfig && Array.isArray((validatedConfig as any).children)) {
				props = {
					...props,
					children: renderChildrenCallback((validatedConfig as any).children, context)
				};
			}
		}

		return <ComponentToRender {...props} />;
	} catch (error: any) {
		// Handle ZodError specifically if it's thrown by validateConfig
		if (error instanceof ZodError) {
			console.error(`DynamicRenderer for '${componentType}': Schema validation failed.`, error.format());
			return <ErrorComponent error={error} config={config} />;
		}
		console.error(`DynamicRenderer for '${componentType}': Caught error during rendering. Message: ${error.message}`, error);
		return <ErrorComponent error={error} config={config} />;
	}
};
