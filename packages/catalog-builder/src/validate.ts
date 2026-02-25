/**
 * Validates a parsed schema object against a catalog.
 *
 * This provides lightweight validation that checks component types
 * against the catalog and detects duplicate IDs, without requiring
 * a full form-engine schema parser.
 */
import type { Catalog } from "./catalog";
import { getCatalogTypes } from "./catalog";

export interface ValidationResult {
	/** Whether the schema passed all checks */
	valid: boolean;
	/** Critical errors that should prevent using the schema */
	errors: string[];
	/** Non-critical warnings about potential issues */
	warnings: string[];
}

/**
 * Validates a parsed schema object against the provided catalog.
 *
 * Performs:
 * 1. Unknown component type detection
 * 2. Duplicate field ID detection (warning)
 *
 * @param parsedSchema – A JS object (e.g. parsed from YAML) representing the schema.
 * @param catalog – The catalog to validate component types against.
 */
export function validateAgainstCatalog(
	parsedSchema: unknown,
	catalog: Catalog,
): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	if (parsedSchema === null || parsedSchema === undefined) {
		errors.push("Schema is empty or null");
		return { valid: false, errors, warnings };
	}

	const validTypes = getCatalogTypes(catalog);

	// Check for unknown component types
	const unknownTypes = findUnknownComponentTypes(parsedSchema, validTypes);
	if (unknownTypes.length > 0) {
		const typeList = unknownTypes.join(", ");
		const availableTypes = validTypes.join(", ");
		errors.push(
			`Unknown component type(s): ${typeList}. Available types: ${availableTypes}`,
		);
	}

	// Check for duplicate IDs
	const duplicateIds = findDuplicateIds(parsedSchema);
	if (duplicateIds.length > 0) {
		const idList = duplicateIds.join(", ");
		warnings.push(`Duplicate field IDs found: ${idList}`);
	}

	return { valid: errors.length === 0, errors, warnings };
}

/**
 * Recursively finds all component types used in the schema that are
 * not present in the catalog.
 */
function findUnknownComponentTypes(obj: unknown, validTypes: string[]): string[] {
	const unknownTypes = new Set<string>();

	function traverse(value: unknown): void {
		if (value === null || value === undefined) return;

		if (Array.isArray(value)) {
			value.forEach(traverse);
			return;
		}

		if (typeof value === "object") {
			const record = value as Record<string, unknown>;
			if ("type" in record && typeof record.type === "string") {
				if (!validTypes.includes(record.type)) {
					unknownTypes.add(record.type);
				}
			}
			Object.values(record).forEach(traverse);
		}
	}

	traverse(obj);
	return Array.from(unknownTypes);
}

/**
 * Recursively finds all field IDs in the schema and identifies duplicates.
 */
function findDuplicateIds(obj: unknown): string[] {
	const idCounts = new Map<string, number>();

	function traverse(value: unknown): void {
		if (value === null || value === undefined) return;

		if (Array.isArray(value)) {
			value.forEach(traverse);
			return;
		}

		if (typeof value === "object") {
			const record = value as Record<string, unknown>;
			if ("id" in record && typeof record.id === "string") {
				idCounts.set(record.id, (idCounts.get(record.id) || 0) + 1);
			}
			Object.values(record).forEach(traverse);
		}
	}

	traverse(obj);

	const duplicates: string[] = [];
	idCounts.forEach((count, id) => {
		if (count > 1) duplicates.push(id);
	});
	return duplicates;
}
