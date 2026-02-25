/**
 * Core catalog types and registry.
 *
 * A catalog describes the available component types for a form schema —
 * their configuration shapes (as Zod schemas), descriptions, and metadata.
 * No React or rendering dependencies are required.
 *
 * Consumers register component definitions via `registerComponent()` or
 * build a catalog object directly with `createCatalog()`.
 */
import { z } from "zod";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A single component type entry in the catalog.
 */
export interface CatalogEntry {
	/** Zod schema for this component's configuration shape */
	schema: z.ZodType<any>;
	/** Whether this component can contain children */
	hasChildren?: boolean;
	/** Human-readable description (useful for docs, AI prompts, editor hints) */
	description?: string;
	/**
	 * Optional config preprocessing function (e.g., parsing asterisks in labels).
	 * Applied before Zod validation.
	 */
	transformConfig?: (data: Record<string, any>) => Record<string, any>;
}

/**
 * A catalog is a collection of component type definitions keyed by type name.
 */
export interface Catalog {
	components: Record<string, CatalogEntry>;
}

// ---------------------------------------------------------------------------
// Global registry (module-scoped singleton)
// ---------------------------------------------------------------------------

const registry = new Map<string, CatalogEntry>();

/**
 * Arguments accepted by `registerComponent()`.
 */
export interface RegisterComponentArgs {
	/** Unique type identifier (e.g. "text", "select", "page") */
	type: string;
	/** Zod schema describing the component's configuration */
	schema: z.ZodType<any>;
	/** Whether this component can contain children */
	hasChildren?: boolean;
	/** Human-readable description */
	description?: string;
	/** Optional config preprocessing */
	transformConfig?: (data: Record<string, any>) => Record<string, any>;
}

/**
 * Registers a component type in the global catalog registry.
 *
 * Components are typically registered at module load time so that the
 * catalog is fully populated before any prompt generation or validation
 * takes place.
 *
 * ```ts
 * registerComponent({
 *   type: "text",
 *   schema: textConfigSchema,
 *   description: "Single-line text input field",
 * });
 * ```
 */
export function registerComponent(args: RegisterComponentArgs): CatalogEntry {
	const { type, schema, hasChildren, description, transformConfig } = args;
	const entry: CatalogEntry = { schema, hasChildren, description, transformConfig };
	registry.set(type, entry);
	return entry;
}

/**
 * Registers multiple component types at once.
 *
 * ```ts
 * registerComponents([
 *   { type: "text", schema: textSchema, description: "Text input" },
 *   { type: "select", schema: selectSchema, description: "Dropdown select" },
 * ]);
 * ```
 */
export function registerComponents(entries: RegisterComponentArgs[]): void {
	for (const entry of entries) {
		registerComponent(entry);
	}
}

// ---------------------------------------------------------------------------
// Catalog access
// ---------------------------------------------------------------------------

/**
 * Returns a snapshot of the current global catalog built from all
 * `registerComponent()` calls.
 */
export function getRegisteredCatalog(): Catalog {
	const components: Record<string, CatalogEntry> = {};
	for (const [type, entry] of registry) {
		components[type] = entry;
	}
	return { components };
}

/**
 * Gets a single catalog entry by type from the global registry.
 */
export function getRegisteredCatalogEntry(type: string): CatalogEntry | undefined {
	return registry.get(type);
}

/**
 * Clears the global registry.
 * Primarily useful for testing.
 */
export function clearRegistry(): void {
	registry.clear();
}

// ---------------------------------------------------------------------------
// Catalog construction helpers (for non-global catalogs)
// ---------------------------------------------------------------------------

/**
 * Creates a standalone catalog object from an explicit definition.
 * Useful when you don't want to use the global registry.
 */
export function createCatalog(definition: {
	components: Record<string, CatalogEntry>;
}): Catalog {
	return { components: { ...definition.components } };
}

/**
 * Gets a component entry from a catalog by type.
 */
export function getCatalogEntry(catalog: Catalog, type: string): CatalogEntry | undefined {
	return catalog.components[type];
}

/**
 * Gets all component type names from a catalog.
 */
export function getCatalogTypes(catalog: Catalog): string[] {
	return Object.keys(catalog.components);
}
