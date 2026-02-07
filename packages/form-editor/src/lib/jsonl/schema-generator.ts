/**
 * JSONL Schema Generator
 *
 * Extended schema generator that uses the JSONL prompt format.
 * Combines the component catalog documentation with JSONL-specific
 * instructions so the LLM knows both what components are available
 * AND that it should output JSONL patches.
 */

import { getRegisteredCatalog, generateCatalogPrompt } from "form-engine";
import { getJsonlPreamble, buildJsonlEditPrompt, buildJsonlCreatePrompt } from "./prompt";

/**
 * SchemaGenerator for JSONL patch mode.
 *
 * Generates system prompts that instruct the LLM to output JSONL patch
 * operations, and formats user messages with the current schema as JSON.
 */
export class JsonlSchemaGenerator {
	private systemPrompt: string;

	constructor() {
		// Generate the catalog documentation (component types, props, etc.)
		// but with our JSONL preamble instead of the default YAML one
		const catalog = getRegisteredCatalog();
		const catalogDocs = generateCatalogPrompt(catalog, {
			includeExamples: true,
			preamble: getJsonlPreamble(),
		});

		this.systemPrompt = catalogDocs;
	}

	/**
	 * Gets the system prompt for the LLM.
	 * Includes JSONL instructions + full component catalog.
	 */
	getSystemPrompt(): string {
		return this.systemPrompt;
	}

	/**
	 * Builds the user message for editing an existing schema.
	 *
	 * @param currentSchemaJson - The current schema as a JSON string
	 * @param userMessage - The user's natural language request
	 */
	buildEditPrompt(currentSchemaJson: string, userMessage: string): string {
		return buildJsonlEditPrompt(currentSchemaJson, userMessage);
	}

	/**
	 * Builds the user message for creating a new form.
	 *
	 * @param userMessage - The user's natural language request
	 */
	buildCreatePrompt(userMessage: string): string {
		return buildJsonlCreatePrompt(userMessage);
	}
}
