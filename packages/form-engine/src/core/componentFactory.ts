import { z } from "zod";
import React from "react";

export interface FormEngineContext {
	formData: Record<string, any>;
	onDataChange: (fieldName: string, value: any) => void;
	formContext?: Record<string, any>; // For JSONLogic, etc., passed into SchemaForm
	formMode?: "view" | "edit" | "print"; // Example modes
	onSubmit?: (formData: Record<string, any>) => void; // Handler for form submission
	// Potentially other global state or functions needed by components
}

export interface ComponentDefinition<ConfigType = any, PropsType = any> {
	type: string;
	schema: z.ZodType<ConfigType, z.ZodTypeDef, any>; // Zod schema for the component's configuration
	component: React.ComponentType<PropsType & { children?: React.ReactNode }>; // The React component
	validateConfig: (data: unknown) => ConfigType; // Parses and validates the raw config data
	transformProps?: (
		parsedConfig: ConfigType,
		context: FormEngineContext,
		renderChildren: (childrenConfig: unknown[] | undefined, context: FormEngineContext) => React.ReactNode
	) => PropsType; // Transforms validated config and context into React props
}

export const componentRegistry = new Map<string, ComponentDefinition<any, any>>();

export function createComponent<
	ConfigType extends { type: string; [key: string]: any },
	PropsType extends object
>(args: {
	type: string;
	schema: z.ZodType<ConfigType, z.ZodTypeDef, any>;
	component: React.ComponentType<PropsType & { children?: React.ReactNode }>;
	transformProps?: (
		parsedConfig: ConfigType,
		context: FormEngineContext,
		renderChildren: (childrenConfig: unknown[] | undefined, context: FormEngineContext) => React.ReactNode
	) => PropsType;
}): ComponentDefinition<ConfigType, PropsType> {
	const definition: ComponentDefinition<ConfigType, PropsType> = {
		type: args.type,
		schema: args.schema,
		component: args.component,
		validateConfig: (data: unknown): ConfigType => {
			if (typeof data === "object" && data && "type" in data && (data as any).type !== args.type) {
				throw new z.ZodError([{
					code: z.ZodIssueCode.custom,
					path: ["type"],
					message: `Expected component type "${args.type}" but received "${(data as any).type}"`,
				}]);
			}
			return args.schema.parse(data) as ConfigType;
		},
		transformProps: args.transformProps,
	};
	componentRegistry.set(args.type, definition);
	return definition; // Though not strictly necessary to return, it can be useful
}

export function getComponentDefinition(type: string): ComponentDefinition | undefined {
	return componentRegistry.get(type);
}

export function getAllComponentDefinitions(): Map<string, ComponentDefinition> {
	return componentRegistry;
}
