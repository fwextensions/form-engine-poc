import { z } from "zod";
import type React from "react";
import type { FormEngineContext } from "../engine/FormEngineContext";
import type { Catalog, CatalogEntry, ChildrenSpec, ComponentKind, ComponentMeta, ValueSpec } from "../catalog/catalog";

export type RenderChildren = (
	childrenConfig: unknown[] | undefined,
	context: FormEngineContext,
) => React.ReactNode;

export type TransformProps<ConfigType, PropsType> = (
	parsedConfig: ConfigType,
	context: FormEngineContext,
	renderChildren: RenderChildren,
) => PropsType;

/**
 * Everything the engine and its consumers know about one component type.
 * The catalog-facing subset (`CatalogEntry`) has no React dependency; the
 * rest wires the type to a React implementation.
 */
export interface ComponentDefinition<ConfigType = any, PropsType = any> extends CatalogEntry {
	type: string;
	kind: ComponentKind;
	schema: z.ZodType<ConfigType, any, any>;
	meta: ComponentMeta & { description: string };
	component: React.ComponentType<PropsType & { children?: React.ReactNode }>;
	/** Parses and validates raw config, applying `transformConfig` first. */
	validateConfig: (data: unknown) => ConfigType;
	transformProps?: TransformProps<ConfigType, PropsType>;
}

/** Arguments for createComponent(). */
export interface CreateComponentArgs<
	ConfigType extends { type: string; [key: string]: any },
	PropsType extends object,
> {
	type: string;
	kind: ComponentKind;
	schema: z.ZodType<ConfigType, any, any>;
	component: React.ComponentType<PropsType & { children?: React.ReactNode }>;
	transformProps?: TransformProps<ConfigType, PropsType>;
	transformConfig?: (data: Record<string, any>) => Record<string, any>;
	/** One-line description used in docs, editor hints and the LLM prompt. */
	description: string;
	/** Minimal valid configuration (without `type`). Verified against `schema` by tests. */
	example?: Omit<ConfigType, "type"> extends infer E ? Partial<E> & Record<string, unknown> : never;
	/** Longer guidance appended to the prompt entry. */
	notes?: string;
	/** Which types may appear in `children`; omit for leaf components. */
	children?: ChildrenSpec;
	/** Value semantics for fields. */
	value?: ValueSpec;
}

const registry = new Map<string, ComponentDefinition>();

/**
 * Creates and registers a component definition. Registration is the single
 * source of truth for rendering, validation, JSON Schema, prompts and
 * exporters: everything else is derived from this map.
 */
export function createComponent<
	ConfigType extends { type: string; [key: string]: any },
	PropsType extends object,
>(args: CreateComponentArgs<ConfigType, PropsType>): ComponentDefinition<ConfigType, PropsType> {
	const { type, kind, schema, component, transformProps, transformConfig, description, example, notes, children, value } = args;

	const definition: ComponentDefinition<ConfigType, PropsType> = {
		type,
		kind,
		schema,
		component,
		transformProps,
		transformConfig,
		children,
		value,
		meta: { description, example: example as Record<string, unknown> | undefined, notes },
		validateConfig: (rawData: unknown): ConfigType => {
			if (typeof rawData === "object" && rawData && "type" in rawData && (rawData as any).type !== type) {
				throw new z.ZodError([{
					code: "custom",
					path: ["type"],
					message: `Expected component type "${type}" but received "${(rawData as any).type}"`,
					input: rawData,
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

	if (registry.has(type)) {
		console.warn(`createComponent: component type "${type}" is being registered twice; the later definition wins.`);
	}
	registry.set(type, definition);

	return definition;
}

export function getComponentDefinition(type: string): ComponentDefinition | undefined {
	return registry.get(type);
}

export function getAllComponentDefinitions(): ReadonlyMap<string, ComponentDefinition> {
	return registry;
}

/** Registered component types of the given kind. */
export function getComponentTypesByKind(kind: ComponentKind): string[] {
	return [...registry.values()].filter((def) => def.kind === kind).map((def) => def.type);
}

/**
 * Returns the catalog view of the registry: every registered definition,
 * keyed by type. Built automatically as components call `createComponent()`.
 */
export function getRegisteredCatalog(): Catalog<ComponentDefinition> {
	const components: Record<string, ComponentDefinition> = {};
	for (const [type, def] of registry) {
		components[type] = def;
	}
	return { components };
}

/** Gets a single registered definition by type (alias of getComponentDefinition). */
export function getRegisteredCatalogEntry(type: string): ComponentDefinition | undefined {
	return registry.get(type);
}
