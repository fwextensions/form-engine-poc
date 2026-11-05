import * as yaml from "js-yaml";
import { validateSchemaTree, type SchemaIssue } from "form-engine";

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
  /** The underlying per-node issues from the form-engine registry */
  issues: SchemaIssue[];
}

/**
 * Validates a YAML schema string against form-engine requirements.
 *
 * Performs the following checks:
 * 1. YAML syntax validation using js-yaml
 * 2. Every node in the tree against the component registry (unknown types,
 *    unknown or invalid properties, disallowed nesting)
 * 3. Duplicate field ID detection (warning)
 *
 * Messages are aggregated per category so they read well in a list.
 */
export function validateSchema(yamlString: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!yamlString || yamlString.trim().length === 0) {
    errors.push("Schema is empty");
    return { valid: false, errors, warnings, issues: [] };
  }

  let parsedYaml: unknown;
  try {
    parsedYaml = yaml.load(yamlString);
  } catch (error) {
    errors.push(`YAML syntax error: ${error instanceof Error ? error.message : "Unable to parse YAML"}`);
    return { valid: false, errors, warnings, issues: [] };
  }

  const issues = validateSchemaTree(parsedYaml);

  const unknownTypes = [...new Set(issues.filter((i) => i.code === "unknown_type").map((i) => i.componentType ?? "?"))];
  if (unknownTypes.length > 0) {
    const available = issues.find((i) => i.code === "unknown_type")?.message.match(/Available types: (.*)$/)?.[1] ?? "";
    errors.push(`Unknown component type(s): ${unknownTypes.join(", ")}. Available types: ${available}`);
  }

  for (const issue of issues) {
    if (issue.severity === "error" && issue.code !== "unknown_type") {
      errors.push(issue.path ? `${issue.path}: ${issue.message}` : issue.message);
    }
  }

  const duplicateIds = [...new Set(issues.filter((i) => i.code === "duplicate_id").map((i) => i.componentId ?? "?"))];
  if (duplicateIds.length > 0) {
    warnings.push(`Duplicate field IDs found: ${duplicateIds.join(", ")}`);
  }

  for (const issue of issues) {
    if (issue.severity === "warning" && issue.code !== "duplicate_id") {
      warnings.push(issue.path ? `${issue.path}: ${issue.message}` : issue.message);
    }
  }

  return { valid: errors.length === 0, errors, warnings, issues };
}
