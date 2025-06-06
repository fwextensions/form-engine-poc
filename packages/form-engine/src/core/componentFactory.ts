import { z } from "zod";
import React, { createContext } from "react";

export interface FormEngineContext {
	formData: Record<string, any>;
	onDataChange: (fieldName: string, value: any) => void;
	formContext: Record<string, any>; // Arbitrary context from the host application
	formMode: "edit" | "view" | "print"; // Current mode of the form
	onSubmit?: (formData: Record<string, any>) => void; // Handler for final form submission

	// New properties for multi-page navigation
	isMultiPage?: boolean;
	currentPageIndex?: number;
	totalPages?: number;
	onNavigateNext?: () => void;
	onNavigatePrev?: () => void;
}

// Default context value - provides sensible defaults or stubs for when no provider is found
// or for initial setup. Components should ideally always be under a Provider with actual values.
const defaultFormEngineContext: FormEngineContext = {
	formData: {},
	onDataChange: (fieldName: string, value: any) => {
		console.warn(
			`onDataChange called for field "${fieldName}" with value "${value}" but no FormEngineContext.Provider was found.`,
		);
	},
	formContext: {},
	formMode: "edit",
	onSubmit: (formData: Record<string, any>) => {
		console.warn(
			`onSubmit called with formData but no FormEngineContext.Provider was found.`, formData
		);
	},
};

// Create the actual React Context
export const FormEngineContextObject = createContext<FormEngineContext | undefined>(defaultFormEngineContext);

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
