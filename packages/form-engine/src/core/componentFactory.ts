import { z } from "zod";
import React from "react";
import { FormEngineContext } from "./FormEngineContext";

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
	transformConfig?: (data: Record<string, any>) => Record<string, any>; // New optional function
}

const componentRegistry = new Map<string, ComponentDefinition>();

type CreateComponentArgs<
	ConfigType extends { type: string; [key: string]: any },
	PropsType extends object
> = {
	type: string;
	schema: z.ZodType<ConfigType, z.ZodTypeDef, any>;
	component: React.ComponentType<PropsType & { children?: React.ReactNode }>;
	transformProps?: (
		parsedConfig: ConfigType,
		context: FormEngineContext,
		renderChildren: (childrenConfig: unknown[] | undefined, context: FormEngineContext) => React.ReactNode
	) => PropsType;
	transformConfig?: (data: Record<string, any>) => Record<string, any>; // New optional function
};

export function createComponent<
	ConfigType extends { type: string; [key: string]: any },
	PropsType extends object
>(
	args: CreateComponentArgs<ConfigType, PropsType>): ComponentDefinition<ConfigType, PropsType>
{
	const definition: ComponentDefinition<ConfigType, PropsType> = {
		...args,
		validateConfig: (rawData: unknown): ConfigType => {
			if (typeof rawData === "object" && rawData && "type" in rawData && (rawData as any).type !== args.type) {
				throw new z.ZodError([{
					code: z.ZodIssueCode.custom,
					path: ["type"],
					message: `Expected component type "${args.type}" but received "${(rawData as any).type}"`,
				}]);
			}

			let dataToParse = rawData;

			// If a transformConfig function is provided, and rawData is an object, apply it
			if (args.transformConfig && typeof rawData === "object" && rawData !== null) {
				dataToParse = args.transformConfig(rawData as Record<string, any>);
			}

			return args.schema.parse(dataToParse) as ConfigType;
		},
	};

	componentRegistry.set(args.type, definition);

	return definition; // Though not strictly necessary to return, it can be useful
}

export function getComponentDefinition(type: string) {
	return componentRegistry.get(type);
}

export function getAllComponentDefinitions() {
	return componentRegistry;
}
