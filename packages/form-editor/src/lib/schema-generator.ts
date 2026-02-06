/**
 * Schema Generator Service
 * 
 * Builds prompts for LLM interactions for schema generation and editing.
 * Provides catalog documentation and formats edit requests.
 */

import { getRegisteredCatalog, generateCatalogPrompt } from "form-engine";

/**
 * SchemaGenerator builds prompts for form schema generation.
 * 
 * It generates system prompts with catalog documentation to ensure the LLM
 * generates valid schemas, and formats edit prompts with current schema context.
 */
export class SchemaGenerator {
	private catalogPrompt: string;

	/**
	 * Creates a new SchemaGenerator instance.
	 * Generates the catalog prompt during initialization.
	 */
	constructor() {
		// Generate catalog prompt once during initialization
		const catalog = getRegisteredCatalog();
		this.catalogPrompt = generateCatalogPrompt(catalog, {
			includeExamples: true,
		});
	}

	/**
	 * Gets the system prompt with catalog documentation.
	 * This should be used as the system message when communicating with the LLM.
	 * 
	 * @returns Complete system prompt for the LLM
	 */
	getSystemPrompt(): string {
		return this.catalogPrompt;
	}

	/**
	 * Builds an edit prompt with current schema and instructions.
	 * This should be used as the user message when editing an existing schema.
	 * 
	 * @param currentSchema - The current YAML schema to modify
	 * @param instructions - Natural language instructions for modifications
	 * @returns Formatted prompt for editing
	 */
	buildEditPrompt(currentSchema: string, instructions: string): string {
		return `Here is the current schema:

\`\`\`yaml
${currentSchema}
\`\`\`

Please modify it according to these instructions: ${instructions}

Remember to output the COMPLETE modified schema, not just the changes.`;
	}
}
