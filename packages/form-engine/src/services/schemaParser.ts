/* eslint-disable @typescript-eslint/no-explicit-any */
import * as z from "zod";
import { getComponentDefinition } from "../core/componentRegistryService";

// This is the schema for the raw input to parseRootFormSchema
// It expects at least a 'type' field to determine the root component.
const AnyRootComponentConfigSchema = z.object({
	type: z.string(),
}).passthrough(); // Allows other properties, to be validated by the specific component's schema

/**
 * Parses and validates the root form schema configuration using the component registry.
 * The rawSchema is expected to be the configuration for a root component (e.g., type: "form").
 */
export function parseRootFormSchema(rawSchema: unknown): { config: any; errors?: z.ZodError } {
	const rootParseResult = AnyRootComponentConfigSchema.safeParse(rawSchema);
	if (!rootParseResult.success) {
		console.error("Invalid root schema: 'type' attribute is missing or invalid.", rootParseResult.error.flatten());
		return { config: null, errors: rootParseResult.error };
	}

	const componentType = rootParseResult.data.type;
	const componentDef = getComponentDefinition(componentType);

	if (!componentDef) {
		const errorMsg = `No component definition found for root schema type: "${componentType}"`;
		console.error(errorMsg);
		return { config: null, errors: new z.ZodError([{ code: z.ZodIssueCode.custom, path: ["type"], message: errorMsg }]) };
	}

	try {
		// Now validate against the specific component's schema
		const validatedConfig = componentDef.validateConfig(rawSchema);
		return { config: validatedConfig };
	} catch (error) {
		if (error instanceof z.ZodError) {
			console.error(`Validation errors for root component "${componentType}":`, error.flatten());
			return { config: null, errors: error };
		}
		const errorMsg = `Unexpected error parsing root component "${componentType}": ${error instanceof Error ? error.message : "Unknown error"}`;
		console.error(errorMsg);
		return { config: null, errors: new z.ZodError([{ code: z.ZodIssueCode.custom, path: [], message: errorMsg }]) };
	}
}
