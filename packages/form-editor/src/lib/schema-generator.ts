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

User request: ${instructions}

Instructions:
- If the request asks for information about the schema (e.g., "list fields", "what fields are there", "show me the structure"), respond with a text answer only. Do NOT output the schema.
- If the request asks to modify, add, remove, or change the schema, output the COMPLETE modified schema in a YAML code block.
- When outputting a schema, use a \`\`\`yaml code block and include the entire schema, not just the changes.`;
	}
}
