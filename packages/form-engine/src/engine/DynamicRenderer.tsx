// packages/form-engine/src/engine/DynamicRenderer.tsx
import React from "react";
import { ZodError } from "zod";
import { getComponentDefinition } from "../core/componentFactory";
import { useFormEngine } from "./FormEngineContext";
import { evaluateCondition } from "../core/conditionLogic";
import { deepMerge } from "../utils/deepMerge";

// Default Error Component
function DefaultErrorComponent({ error, config }: { error: Error; config: unknown }) {
	return (
		<div style={{ color: "red", border: "1px solid red", padding: "10px", margin: "5px 0" }}>
			<p>Error rendering component:</p>
			<pre>{error.message}</pre>
			<pre>{JSON.stringify(config, null, 2)}</pre>
		</div>
	);
}

export interface DynamicRendererProps {
		config: unknown;
		ErrorComponent?: React.FC<{ error: Error; config: unknown }>;
}
export const DynamicRenderer: React.FC<DynamicRendererProps> = ({ config, ErrorComponent = DefaultErrorComponent }) => {
		const context = useFormEngine();
		const currentConfigTypeForLog = (config as any)?.type ?? "unknown_config_type";

		if (!config || typeof config !== "object" || !("type" in config) || typeof (config as any).type !== "string") {
				console.error(`DynamicRenderer (config type: ${currentConfigTypeForLog}): Invalid or missing component configuration or type.`, config);
				return <ErrorComponent error={new Error("Invalid component configuration or missing type.")} config={config} />;
		}

		const componentType = (config as { type: string }).type;

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
						// Deep merge so nested objects are preserved; dynamic props take precedence
						validatedConfig = deepMerge(validatedConfig as any, dynamicPropsForComponent as any) as typeof validatedConfig;
				}
				// --- END: Merge dynamic props ---

				if ((validatedConfig as any).hidden || ((validatedConfig as any).condition && !evaluateCondition((validatedConfig as any).condition, context.formData, context.formContext))) {
						// Condition not met, render nothing
						return null;
				}

				const ComponentToRender = componentDef.component;

				const renderChildrenCallback = (childrenConfig: unknown[] | undefined, _ignoredContext?: unknown): React.ReactNode =>
						childrenConfig?.map((childConfig: unknown, index: number) => (
								<DynamicRenderer key={index} config={childConfig} ErrorComponent={ErrorComponent} />
						));

				let props: any;
				if (componentDef.transformProps) {
						props = componentDef.transformProps(validatedConfig as any, context, renderChildrenCallback);
				} else {
						props = (validatedConfig as any).props || (validatedConfig as any);

						if (validatedConfig && typeof validatedConfig === "object" && "children" in (validatedConfig as any) && Array.isArray((validatedConfig as any).children)) {
								props = {
										...props,
										children: renderChildrenCallback((validatedConfig as any).children),
								};
						}
				}

				return <ComponentToRender {...props} />;
		} catch (error: any) {
				// During live editing, field configs may be temporarily invalid
				if (error instanceof ZodError) {
						console.warn(`DynamicRenderer for '${componentType}': temporary schema validation issue while editing.`);
						return null;
				}
				console.error(`DynamicRenderer for '${componentType}': Caught error during rendering. Message: ${error.message}`, error);
				return <ErrorComponent error={error} config={config} />;
		}
};
