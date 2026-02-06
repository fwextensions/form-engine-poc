import { z } from "zod";
import React from "react";
import { FormEngineContext } from "../engine/FormEngineContext";
import type { CatalogEntry, Catalog } from "../catalog/catalog";

export interface ComponentDefinition<ConfigType = any, PropsType = any> {
	type: string;
	schema: z.ZodType<ConfigType, any, any>; // Zod schema for the component's configuration
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
const catalogRegistry = new Map<string, CatalogEntry>();

/**
 * Arguments for createComponent() - includes catalog metadata for auto-registration.
 */
type CreateComponentArgs<
	ConfigType extends { type: string; [key: string]: any },
	PropsType extends object
> = {
	type: string;
	schema: z.ZodType<ConfigType, any, any>;
	component: React.ComponentType<PropsType & { children?: React.ReactNode }>;
	transformProps?: (
		parsedConfig: ConfigType,
		context: FormEngineContext,
		renderChildren: (childrenConfig: unknown[] | undefined, context: FormEngineContext) => React.ReactNode
	) => PropsType;
	transformConfig?: (data: Record<string, any>) => Record<string, any>;
	/** Human-readable description for catalog (useful for docs, AI prompts, editor hints) */
	description?: string;
	/** Whether this component can contain children (for catalog metadata) */
	hasChildren?: boolean;
};

/**
 * Creates and registers a component definition.
 *
 * Automatically registers the component's schema in the catalog registry,
 * making it available via `getRegisteredCatalog()` without manual catalog
 * entry file maintenance.
 */
export function createComponent<
	ConfigType extends { type: string; [key: string]: any },
	PropsType extends object
>(
	args: CreateComponentArgs<ConfigType, PropsType>): ComponentDefinition<ConfigType, PropsType>
{
	const { type, schema, component, transformProps, transformConfig, description, hasChildren } = args;

	// Build the catalog entry from the component definition
	const catalogEntry: CatalogEntry = {
		schema,
		description,
		hasChildren,
		transformConfig,
	};

	const definition: ComponentDefinition<ConfigType, PropsType> = {
		type,
		schema,
		component,
		transformProps,
		transformConfig,
		catalogEntry,
		validateConfig: (rawData: unknown): ConfigType => {
			if (typeof rawData === "object" && rawData && "type" in rawData && (rawData as any).type !== type) {
				throw new z.ZodError([{
					code: z.ZodIssueCode.custom,
					path: ["type"],
					message: `Expected component type "${type}" but received "${(rawData as any).type}"`,
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

	// Register in both registries
	componentRegistry.set(type, definition);
	catalogRegistry.set(type, catalogEntry);

	return definition;
}

export function getComponentDefinition(type: string) {
	return componentRegistry.get(type);
}

export function getAllComponentDefinitions() {
	return componentRegistry;
}

/**
 * Returns the auto-registered catalog containing all component schemas.
 * The catalog is built automatically as components call `createComponent()`.
 *
 * This allows accessing schema information without manually maintaining
 * a separate catalog file - the catalog builds itself when components
 * are imported.
 */
export function getRegisteredCatalog(): Catalog {
	const components: Record<string, CatalogEntry> = {};
	for (const [type, entry] of catalogRegistry) {
		components[type] = entry;
	}
	return { components };
}

/**
 * Gets a single catalog entry by type.
 */
export function getRegisteredCatalogEntry(type: string): CatalogEntry | undefined {
	return catalogRegistry.get(type);
}
