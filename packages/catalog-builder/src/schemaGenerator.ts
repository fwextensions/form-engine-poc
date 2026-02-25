/**
 * SchemaGenerator — builds LLM prompts from a catalog.
 *
 * This is the main integration point for applications that want to
 * let users chat with an AI to build/edit schemas using registered
 * components.
 *
 * Usage:
 * ```ts
 * import { getRegisteredCatalog, SchemaGenerator } from "catalog-builder";
 *
 * const generator = new SchemaGenerator(getRegisteredCatalog(), {
 *   includeExamples: true,
 * });
 *
 * // Use as the system prompt when calling an LLM
 * const systemPrompt = generator.getSystemPrompt();
 *
 * // Build a user message that asks the LLM to edit an existing schema
 * const userMessage = generator.buildEditPrompt(currentYaml, "add an email field");
 * ```
 */
import type { Catalog } from "./catalog";
import { generateCatalogPrompt, type CatalogPromptOptions } from "./prompt";

export interface SchemaGeneratorOptions extends CatalogPromptOptions {}

export class SchemaGenerator {
	private catalogPrompt: string;

	/**
	 * @param catalog – The component catalog to generate prompts from.
	 * @param options – Prompt generation options (preamble, examples, etc.).
	 */
	constructor(catalog: Catalog, options?: SchemaGeneratorOptions) {
		this.catalogPrompt = generateCatalogPrompt(catalog, {
			includeExamples: true,
			...options,
		});
	}

	/**
	 * Returns the system prompt containing full catalog documentation.
	 * Intended to be used as the `system` message when communicating with an LLM.
	 */
	getSystemPrompt(): string {
		return this.catalogPrompt;
	}

	/**
	 * Builds a user-role prompt that includes the current schema and
	 * the user's natural-language edit instructions.
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
