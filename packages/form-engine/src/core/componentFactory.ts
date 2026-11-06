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

/** One problem found while checking a component config. */
export interface ConfigIssue {
	/** Path inside the component config (empty for the component itself). */
	path: (string | number)[];
	message: string;
	/** Warnings never prevent rendering; errors do. */
	severity: "error" | "warning";
	/** Zod issue code, or "unknown_key" for a stripped unrecognised key. */
	code: string;
}

/** Result of a lenient config check. */
export interface ConfigCheck<ConfigType = any> {
	/** Present when the config is usable (possibly after stripping unknown keys). */
	config?: ConfigType;
	issues: ConfigIssue[];
}

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
	/** Parses and validates raw config, applying `transformConfig` first. Throws on any issue, including unknown keys. */
	validateConfig: (data: unknown) => ConfigType;
	/**
	 * Lenient variant for live rendering and editors: unknown keys are stripped
	 * and reported as warnings; anything else is reported as an error with no config.
	 */
	checkConfig: (data: unknown) => ConfigCheck<ConfigType>;
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
	/** Mark a layout component as a step of a multi-page form (see `page`). */
	isPage?: boolean;
	/** Value semantics for fields. */
	value?: ValueSpec;
}

/** Zod 4 paths may contain symbols; issue paths only keep string and number segments. */
function issuePath(path: readonly PropertyKey[]): (string | number)[] {
	return path.filter((segment): segment is string | number => typeof segment !== "symbol");
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
	const { type, kind, schema, component, transformProps, transformConfig, description, example, notes, children, isPage, value } = args;

	const definition: ComponentDefinition<ConfigType, PropsType> = {
		type,
		kind,
		schema,
		component,
		transformProps,
		transformConfig,
		children,
		isPage,
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
		checkConfig: (rawData: unknown): ConfigCheck<ConfigType> => {
			if (typeof rawData !== "object" || rawData === null) {
				return { issues: [{ path: [], message: "Component configuration must be an object", severity: "error", code: "invalid_type" }] };
			}
			if ("type" in rawData && (rawData as any).type !== type) {
				return { issues: [{ path: ["type"], message: `Expected component type "${type}" but received "${(rawData as any).type}"`, severity: "error", code: "custom" }] };
			}

			const dataToParse = transformConfig ? transformConfig(rawData as Record<string, any>) : (rawData as Record<string, any>);
			const first = schema.safeParse(dataToParse);
			if (first.success) {
				return { config: first.data as ConfigType, issues: [] };
			}

			// Strip unrecognised keys (reported as warnings) and try once more.
			const warnings: ConfigIssue[] = [];
			const stripped = structuredClone(dataToParse);
			for (const issue of first.error.issues) {
				if (issue.code === "unrecognized_keys") {
					const parent = issue.path.reduce<any>((acc, key) => (acc == null ? acc : acc[key as any]), stripped);
					for (const key of (issue as any).keys as string[]) {
						if (parent && typeof parent === "object") delete parent[key];
						warnings.push({
							path: [...issuePath(issue.path), key],
							message: `Unknown property "${key}" for component type "${type}"; it was ignored`,
							severity: "warning",
							code: "unknown_key",
						});
					}
				}
			}
			const second = warnings.length > 0 ? schema.safeParse(stripped) : first;
			if (second.success) {
				return { config: second.data as ConfigType, issues: warnings };
			}
			const errors: ConfigIssue[] = second.error.issues
				.filter((issue) => issue.code !== "unrecognized_keys")
				.map((issue) => ({ path: issuePath(issue.path), message: issue.message, severity: "error" as const, code: issue.code }));
			return { issues: [...errors, ...warnings] };
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

/** True when `node` is a config whose registered type is a page (a step of a multi-page form). */
export function isPageNode(node: unknown): boolean {
	if (!node || typeof node !== "object") return false;
	const type = (node as { type?: unknown }).type;
	return typeof type === "string" && registry.get(type)?.isPage === true;
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
