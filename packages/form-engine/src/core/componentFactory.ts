import { z } from "zod";
import React from "react";
import { FormEngineContext } from "../engine/FormEngineContext";
import type { CatalogEntry } from "../catalog/catalog";

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
	transformConfig?: (data: Record<string, any>) => Record<string, any>; // Optional config preprocessing
	catalogEntry?: CatalogEntry; // Reference to the catalog entry if using catalog-based registration
}

const componentRegistry = new Map<string, ComponentDefinition>();

/**
 * Arguments for createComponent() when using an inline schema (legacy pattern).
 */
type CreateComponentArgsWithSchema<
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
	transformConfig?: (data: Record<string, any>) => Record<string, any>;
};

/**
 * Arguments for createComponent() when using a catalog entry (new pattern).
 * The schema and transformConfig come from the catalog entry.
 */
type CreateComponentArgsWithCatalogEntry<
	ConfigType extends { type: string; [key: string]: any },
	PropsType extends object
> = {
	type: string;
	catalogEntry: CatalogEntry;
	component: React.ComponentType<PropsType & { children?: React.ReactNode }>;
	transformProps?: (
		parsedConfig: ConfigType,
		context: FormEngineContext,
		renderChildren: (childrenConfig: unknown[] | undefined, context: FormEngineContext) => React.ReactNode
	) => PropsType;
	// Note: transformConfig can be overridden, otherwise it comes from catalogEntry
	transformConfig?: (data: Record<string, any>) => Record<string, any>;
};

/**
 * Union type for createComponent arguments - supports both legacy inline schema
 * and new catalog entry patterns for backward compatibility.
 */
type CreateComponentArgs<
	ConfigType extends { type: string; [key: string]: any },
	PropsType extends object
> = CreateComponentArgsWithSchema<ConfigType, PropsType> | CreateComponentArgsWithCatalogEntry<ConfigType, PropsType>;

/**
 * Type guard to check if args use catalog entry pattern.
 */
function hasCatalogEntry<
	ConfigType extends { type: string; [key: string]: any },
	PropsType extends object
>(args: CreateComponentArgs<ConfigType, PropsType>): args is CreateComponentArgsWithCatalogEntry<ConfigType, PropsType> {
	return "catalogEntry" in args && args.catalogEntry !== undefined;
}

/**
 * Creates and registers a component definition.
 *
 * Supports two patterns:
 * 1. Legacy inline schema: { type, schema, component, transformProps?, transformConfig? }
 * 2. Catalog entry: { type, catalogEntry, component, transformProps?, transformConfig? }
 *
 * When using a catalog entry, the schema and transformConfig are derived from the entry
 * unless explicitly overridden.
 */
export function createComponent<
	ConfigType extends { type: string; [key: string]: any },
	PropsType extends object
>(
	args: CreateComponentArgs<ConfigType, PropsType>): ComponentDefinition<ConfigType, PropsType>
{
	// Extract schema and transformConfig based on which pattern is used
	let schema: z.ZodType<ConfigType, z.ZodTypeDef, any>;
	let transformConfig: ((data: Record<string, any>) => Record<string, any>) | undefined;
	let catalogEntry: CatalogEntry | undefined;

	if (hasCatalogEntry(args)) {
		// New catalog entry pattern
		catalogEntry = args.catalogEntry;
		schema = catalogEntry.schema as z.ZodType<ConfigType, z.ZodTypeDef, any>;
		// Use explicit transformConfig if provided, otherwise use catalog entry's transformConfig
		transformConfig = args.transformConfig ?? catalogEntry.transformConfig;
	} else {
		// Legacy inline schema pattern
		schema = args.schema;
		transformConfig = args.transformConfig;
	}

	const definition: ComponentDefinition<ConfigType, PropsType> = {
		type: args.type,
		schema,
		component: args.component,
		transformProps: args.transformProps,
		transformConfig,
		catalogEntry,
		validateConfig: (rawData: unknown): ConfigType => {
			if (typeof rawData === "object" && rawData && "type" in rawData && (rawData as any).type !== args.type) {
				throw new z.ZodError([{
					code: z.ZodIssueCode.custom,
					path: ["type"],
					message: `Expected component type "${args.type}" but received "${(rawData as any).type}"`,
				}]);
			}

			let dataToParse = rawData;

			// If a transformConfig function is available, and rawData is an object, apply it
			if (transformConfig && typeof rawData === "object" && rawData !== null) {
				dataToParse = transformConfig(rawData as Record<string, any>);
			}

			return schema.parse(dataToParse) as ConfigType;
		},
	};

	componentRegistry.set(args.type, definition);

	return definition;
}

export function getComponentDefinition(type: string) {
	return componentRegistry.get(type);
}

export function getAllComponentDefinitions() {
	return componentRegistry;
}
