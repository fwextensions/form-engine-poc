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

type Resolved =
	| { kind: "render"; Component: React.ComponentType<any>; props: Record<string, unknown> }
	| { kind: "hidden" }
	| { kind: "error"; error: Error }
	| { kind: "invalid" };

export const DynamicRenderer: React.FC<DynamicRendererProps> = ({ config, ErrorComponent = DefaultErrorComponent }) => {
	const context = useFormEngine();
	const currentConfigTypeForLog = (config as any)?.type ?? "unknown_config_type";

	if (!config || typeof config !== "object" || !("type" in config) || typeof (config as any).type !== "string") {
		console.error(`DynamicRenderer (config type: ${currentConfigTypeForLog}): Invalid or missing component configuration or type.`, config);
		return <ErrorComponent error={new Error("Invalid component configuration or missing type.")} config={config} />;
	}

	const componentType = (config as { type: string }).type;

	const renderChildrenCallback = (childrenConfig: unknown[] | undefined): React.ReactNode =>
		childrenConfig?.map((childConfig: unknown, index: number) => (
			<DynamicRenderer key={index} config={childConfig} ErrorComponent={ErrorComponent} />
		));

	// Resolve the component and its props without building JSX inside the
	// try/catch, so render-time errors still reach error boundaries.
	let resolved: Resolved;
	try {
		resolved = resolve(componentType, config, context, renderChildrenCallback);
	} catch (error: any) {
		// During live editing, field configs may be temporarily invalid
		if (error instanceof ZodError) {
			console.warn(`DynamicRenderer for '${componentType}': temporary schema validation issue while editing.`);
			resolved = { kind: "invalid" };
		} else {
			console.error(`DynamicRenderer for '${componentType}': Caught error during rendering. Message: ${error.message}`, error);
			resolved = { kind: "error", error };
		}
	}

	switch (resolved.kind) {
		case "render": {
			const { Component, props } = resolved;
			return <Component {...props} />;
		}
		case "error":
			return <ErrorComponent error={resolved.error} config={config} />;
		default:
			return null;
	}
};

const warned = new Set<string>();
function warnOnce(key: string, message: string) {
	if (warned.has(key)) return;
	warned.add(key);
	console.warn(message);
}

function resolve(
	componentType: string,
	config: object,
	context: ReturnType<typeof useFormEngine>,
	renderChildren: (childrenConfig: unknown[] | undefined) => React.ReactNode,
): Resolved {
	const componentDef = getComponentDefinition(componentType);
	if (!componentDef) {
		const error = new Error(`Component type "${componentType}" not registered.`);
		console.error(`DynamicRenderer for '${componentType}': ${error.message}`);
		return { kind: "error", error };
	}

	// Lenient check: unknown keys are stripped and reported once; real errors throw.
	const check = componentDef.checkConfig(config);
	for (const issue of check.issues) {
		if (issue.severity === "warning") warnOnce(`${componentType}:${(config as any).id ?? ""}:${issue.path.join(".")}`, `DynamicRenderer: ${issue.message}`);
	}
	if (!check.config) {
		throw new ZodError(check.issues.filter((i) => i.severity === "error").map((i) => ({ code: "custom" as const, path: i.path, message: i.message, input: config })));
	}
	let validatedConfig = check.config;

	// Merge dynamic props from the rules engine. Deep merge so nested objects
	// are preserved; dynamic props take precedence.
	const componentId = (validatedConfig as any)?.id;
	if (context?.dynamicProps?.[componentId]) {
		validatedConfig = deepMerge(validatedConfig as any, context.dynamicProps[componentId] as any) as typeof validatedConfig;
	}

	if ((validatedConfig as any).hidden || ((validatedConfig as any).condition && !evaluateCondition((validatedConfig as any).condition, context.formData, context.formContext))) {
		return { kind: "hidden" };
	}

	let props: any;
	if (componentDef.transformProps) {
		props = componentDef.transformProps(validatedConfig as any, context, renderChildren);
	} else {
		props = (validatedConfig as any).props || (validatedConfig as any);

		if (validatedConfig && typeof validatedConfig === "object" && "children" in (validatedConfig as any) && Array.isArray((validatedConfig as any).children)) {
			props = {
				...props,
				children: renderChildren((validatedConfig as any).children),
			};
		}
	}

	return { kind: "render", Component: componentDef.component, props };
}
