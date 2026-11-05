// packages/form-engine/src/catalog/catalog.ts
// Catalog types and helpers. No runtime React dependency: everything here can
// be used for validation, JSON Schema generation and prompt construction.
import { z } from "zod";

/**
 * What role a component plays in a form. Consumers branch on this instead of
 * on hard-coded type names ("form", "page", ...).
 *
 * - `field`:  collects a value under its `id` (text, select, checkbox, ...)
 * - `layout`: groups other components (form, page)
 * - `static`: renders content but collects nothing (html)
 */
export type ComponentKind = "field" | "layout" | "static";

/**
 * Documentation attached to a component. `example` is a minimal valid config
 * (without `type`) that is parsed through the component's own schema in a
 * test, so it cannot drift from the schema.
 */
export interface ComponentMeta {
	/** One-line description used in docs, editor hints and the LLM prompt. */
	description?: string;
	/** Minimal valid configuration, minus `type`. */
	example?: Record<string, unknown>;
	/** Longer guidance (authoring tips, gotchas) appended to the prompt entry. */
	notes?: string;
}

/**
 * Which component types may appear in this component's `children`.
 * Omitted entirely for leaf components.
 */
export interface ChildrenSpec {
	/** `"any"` allows every registered type (minus `deny`). */
	allow: "any" | readonly string[];
	/** Types excluded even when `allow` is `"any"`. */
	deny?: readonly string[];
}

/**
 * How a field's value behaves, for consumers that read or write form data
 * without rendering (exporters, data layers, tests).
 */
export interface ValueSpec {
	/** The value a field reports when the user has entered nothing. */
	empty: unknown;
	/** Converts a stored value to the string a UI control uses. */
	serialize?: (value: unknown) => string;
	/** Converts a UI control string back to the stored value. */
	deserialize?: (serialized: string) => unknown;
}

/**
 * A catalog entry describes a component type's shape without any React
 * dependency. `ComponentDefinition` (in `core/componentFactory.ts`) extends it
 * with the rendering pieces.
 */
export interface CatalogEntry {
	/** Zod schema for this component's configuration in the YAML/JSON schema. */
	schema: z.ZodType<any>;
	/** Role of the component; defaults to `"field"` when unspecified. */
	kind?: ComponentKind;
	/** Documentation and example. */
	meta?: ComponentMeta;
	/** Present when the component can contain children. */
	children?: ChildrenSpec;
	/** Value semantics for field components. */
	value?: ValueSpec;
	/**
	 * Optional config preprocessing function (e.g., parsing asterisks in labels).
	 * This is schema-level transformation that happens before Zod validation.
	 */
	transformConfig?: (data: Record<string, any>) => Record<string, any>;
}

/**
 * A catalog is a collection of component type definitions.
 */
export interface Catalog<E extends CatalogEntry = CatalogEntry> {
	components: Record<string, E>;
}

/**
 * Creates a catalog from a map of entries. Entries without a `kind` are
 * treated as fields.
 */
export function createCatalog<E extends CatalogEntry>(definition: { components: Record<string, E> }): Catalog<E> {
	return { components: { ...definition.components } };
}

/** Gets a component entry from the catalog by type. */
export function getCatalogEntry<E extends CatalogEntry>(catalog: Catalog<E>, type: string): E | undefined {
	return catalog.components[type];
}

/** Gets all component types from the catalog. */
export function getCatalogTypes(catalog: Catalog): string[] {
	return Object.keys(catalog.components);
}

/** The effective kind of an entry (`"field"` when unspecified). */
export function getEntryKind(entry: CatalogEntry): ComponentKind {
	return entry.kind ?? "field";
}

/** Component types of a given kind. */
export function getCatalogTypesByKind(catalog: Catalog, kind: ComponentKind): string[] {
	return getCatalogTypes(catalog).filter((type) => getEntryKind(catalog.components[type]) === kind);
}

/** True when the entry may contain children. */
export function entryAllowsChildren(entry: CatalogEntry): boolean {
	return entry.children !== undefined;
}

/**
 * Resolves the concrete list of child types an entry accepts, given the
 * catalog it lives in. Returns an empty array for leaf components.
 */
export function resolveAllowedChildren(catalog: Catalog, entry: CatalogEntry): string[] {
	if (!entry.children) return [];
	const { allow, deny = [] } = entry.children;
	const candidates = allow === "any" ? getCatalogTypes(catalog) : [...allow];
	return candidates.filter((type) => !deny.includes(type));
}
