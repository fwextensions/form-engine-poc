// packages/form-engine/src/catalog/catalog.ts
// Catalog types and factory - no React dependencies
import { z } from "zod";

/**
 * A catalog entry describes a component type's shape without any React dependency.
 * This allows schema information to be used independently for validation,
 * documentation, JSON Schema generation, and AI prompt construction.
 */
export interface CatalogEntry {
	/** Zod schema for this component's configuration in the YAML/JSON schema */
	schema: z.ZodType<any>;
	/** Whether this component can contain children */
	hasChildren?: boolean;
	/** Human-readable description (useful for docs, AI prompts, editor hints) */
	description?: string;
	/**
	 * Optional config preprocessing function (e.g., parsing asterisks in labels).
	 * This is schema-level transformation that happens before Zod validation.
	 */
	transformConfig?: (data: Record<string, any>) => Record<string, any>;
}

/**
 * A catalog is a collection of component type definitions.
 * It describes what components exist and what props they accept,
 * without any React implementation details.
 */
export interface Catalog {
	components: Record<string, CatalogEntry>;
}

/**
 * Creates a catalog from component definitions.
 * The catalog can be used independently of React for validation,
 * schema generation, and other purposes.
 */
export function createCatalog(definition: {
	components: Record<string, CatalogEntry>;
}): Catalog {
	return {
		components: { ...definition.components },
	};
}

/**
 * Gets a component entry from the catalog by type.
 */
export function getCatalogEntry(catalog: Catalog, type: string): CatalogEntry | undefined {
	return catalog.components[type];
}

/**
 * Gets all component types from the catalog.
 */
export function getCatalogTypes(catalog: Catalog): string[] {
	return Object.keys(catalog.components);
}
