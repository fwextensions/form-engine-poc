import * as yaml from "js-yaml";
import { parseRootFormSchema, getRegisteredCatalog, getCatalogTypes } from "form-engine";

/**
 * Result of schema validation containing validation status and any errors/warnings.
 */
export interface ValidationResult {
  /** Whether the schema is valid and can be safely used */
  valid: boolean;
  /** Critical errors that prevent the schema from being used */
  errors: string[];
  /** Non-critical warnings about potential issues */
  warnings: string[];
}

/**
 * Validates a YAML schema string against form-engine requirements.
 * 
 * Performs the following checks:
 * 1. YAML syntax validation using js-yaml
 * 2. Schema structure validation using form-engine parseRootFormSchema
 * 3. Component type validation against registered catalog
 * 4. Duplicate field ID detection (warning)
 * 
 * @param yamlString - The YAML schema string to validate
 * @returns ValidationResult with valid flag, errors, and warnings
 */
export function validateSchema(yamlString: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Step 1: Check for empty input
  if (!yamlString || yamlString.trim().length === 0) {
    errors.push("Schema is empty");
    return { valid: false, errors, warnings };
  }

  // Step 2: Parse YAML syntax
  let parsedYaml: unknown;
  try {
    parsedYaml = yaml.load(yamlString);
  } catch (error) {
    if (error instanceof Error) {
      errors.push(`YAML syntax error: ${error.message}`);
    } else {
      errors.push("YAML syntax error: Unable to parse YAML");
    }
    return { valid: false, errors, warnings };
  }

  // Step 3: Get catalog for validation
  const catalog = getRegisteredCatalog();
  const validTypes = getCatalogTypes(catalog);

  // Step 4: Check for unknown component types before form-engine validation
  // This allows us to provide better error messages with available types
  const unknownTypes = findUnknownComponentTypes(parsedYaml, validTypes);
  
  if (unknownTypes.length > 0) {
    const typeList = unknownTypes.join(", ");
    const availableTypes = validTypes.join(", ");
    errors.push(`Unknown component type(s): ${typeList}. Available types: ${availableTypes}`);
  }

  // Step 5: Validate against form-engine schema parser (only if no unknown types)
  // If there are unknown types, skip this to avoid duplicate errors
  if (unknownTypes.length === 0) {
    const parseResult = parseRootFormSchema(parsedYaml);
    if (parseResult.errors) {
      // Extract error messages from Zod errors
      const zodErrors = parseResult.errors.errors.map((err) => {
        const path = err.path.length > 0 ? `${err.path.join(".")}: ` : "";
        return `${path}${err.message}`;
      });
      errors.push(...zodErrors);
    }
  }

  // Step 6: Check for duplicate field IDs (warning only)
  // Do this even if there are errors, as it's just a warning
  const duplicateIds = findDuplicateIds(parsedYaml);
  if (duplicateIds.length > 0) {
    const idList = duplicateIds.join(", ");
    warnings.push(`Duplicate field IDs found: ${idList}`);
  }

  // If we have errors at this point, return with errors and warnings
  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  // Final validation result
  const valid = errors.length === 0;
  return { valid, errors, warnings };
}

/**
 * Recursively finds all component types used in the schema that are not
 * registered in the catalog.
 * 
 * @param obj - The parsed schema object to search
 * @param validTypes - Array of valid component type names from the catalog
 * @returns Array of unknown component type names
 */
function findUnknownComponentTypes(obj: unknown, validTypes: string[]): string[] {
  const unknownTypes = new Set<string>();

  function traverse(value: unknown): void {
    if (value === null || value === undefined) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(traverse);
      return;
    }

    if (typeof value === "object") {
      const record = value as Record<string, unknown>;
      
      // Check if this object has a 'type' property
      if ("type" in record && typeof record.type === "string") {
        if (!validTypes.includes(record.type)) {
          unknownTypes.add(record.type);
        }
      }

      // Recursively traverse all properties
      Object.values(record).forEach(traverse);
    }
  }

  traverse(obj);
  return Array.from(unknownTypes);
}

/**
 * Recursively finds all field IDs in the schema and identifies duplicates.
 * 
 * @param obj - The parsed schema object to search
 * @returns Array of duplicate ID values
 */
function findDuplicateIds(obj: unknown): string[] {
  const idCounts = new Map<string, number>();

  function traverse(value: unknown): void {
    if (value === null || value === undefined) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(traverse);
      return;
    }

    if (typeof value === "object") {
      const record = value as Record<string, unknown>;
      
      // Check if this object has an 'id' property
      if ("id" in record && typeof record.id === "string") {
        const currentCount = idCounts.get(record.id) || 0;
        idCounts.set(record.id, currentCount + 1);
      }

      // Recursively traverse all properties
      Object.values(record).forEach(traverse);
    }
  }

  traverse(obj);

  // Return only IDs that appear more than once
  const duplicates: string[] = [];
  idCounts.forEach((count, id) => {
    if (count > 1) {
      duplicates.push(id);
    }
  });

  return duplicates;
}
