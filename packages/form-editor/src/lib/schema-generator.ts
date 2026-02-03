/**
 * Schema Generator Service
 * 
 * Orchestrates LLM interactions for schema generation and editing.
 * Manages conversation history and builds prompts with catalog documentation.
 */

import type { LLMClient, LLMMessage } from "./llm-client";
import { getRegisteredCatalog, generateCatalogPrompt } from "form-engine";

/**
 * SchemaGenerator manages LLM interactions for form schema generation.
 * 
 * It maintains conversation history to support iterative editing and
 * builds system prompts with catalog documentation to ensure the LLM
 * generates valid schemas.
 */
export class SchemaGenerator {
	private client: LLMClient;
	private catalogPrompt: string;
	private conversationHistory: LLMMessage[];

	/**
	 * Creates a new SchemaGenerator instance.
	 * 
	 * @param client - LLM client for communicating with the AI provider
	 */
	constructor(client: LLMClient) {
		this.client = client;
		
		// Generate catalog prompt once during initialization
		const catalog = getRegisteredCatalog();
		this.catalogPrompt = generateCatalogPrompt(catalog, {
			includeExamples: true,
		});
		
		// Initialize empty conversation history
		this.conversationHistory = [];
	}

	/**
	 * Generates a new schema from a natural language description.
	 * Streams the response and stores conversation history.
	 * 
	 * @param description - Natural language description of the desired form
	 * @returns AsyncIterable of string chunks as they arrive from the LLM
	 */
	async *generate(description: string): AsyncIterable<string> {
		// Build system prompt with catalog documentation
		const systemPrompt = this.buildSystemPrompt();
		
		// Create messages array with system prompt and user description
		const messages: LLMMessage[] = [
			{ role: "system", content: systemPrompt },
			...this.conversationHistory,
			{ role: "user", content: description },
		];
		
		// Stream response from LLM
		let fullResponse = "";
		for await (const chunk of this.client.chat(messages)) {
			fullResponse += chunk;
			yield chunk;
		}
		
		// Store conversation history
		this.conversationHistory.push(
			{ role: "user", content: description },
			{ role: "assistant", content: fullResponse }
		);
	}

	/**
	 * Edits an existing schema based on instructions.
	 * Includes current schema in context and requests complete output.
	 * 
	 * @param currentSchema - The current YAML schema to modify
	 * @param instructions - Natural language instructions for modifications
	 * @returns AsyncIterable of string chunks as they arrive from the LLM
	 */
	async *edit(currentSchema: string, instructions: string): AsyncIterable<string> {
		// Build system prompt with catalog documentation
		const systemPrompt = this.buildSystemPrompt();
		
		// Build user message with current schema and instructions
		const userMessage = this.buildEditPrompt(currentSchema, instructions);
		
		// Create messages array with system prompt, history, and edit request
		const messages: LLMMessage[] = [
			{ role: "system", content: systemPrompt },
			...this.conversationHistory,
			{ role: "user", content: userMessage },
		];
		
		// Stream response from LLM
		let fullResponse = "";
		for await (const chunk of this.client.chat(messages)) {
			fullResponse += chunk;
			yield chunk;
		}
		
		// Store conversation history
		this.conversationHistory.push(
			{ role: "user", content: userMessage },
			{ role: "assistant", content: fullResponse }
		);
	}

	/**
	 * Clears conversation history for a fresh start.
	 * Useful when starting a completely new form or resetting context.
	 */
	resetConversation(): void {
		this.conversationHistory = [];
	}

	/**
	 * Builds the system prompt with catalog documentation.
	 * 
	 * @returns Complete system prompt for the LLM
	 */
	private buildSystemPrompt(): string {
		return this.catalogPrompt;
	}

	/**
	 * Builds the edit prompt with current schema and instructions.
	 * 
	 * @param currentSchema - The current YAML schema
	 * @param instructions - User's modification instructions
	 * @returns Formatted prompt for editing
	 */
	private buildEditPrompt(currentSchema: string, instructions: string): string {
		return `Here is the current schema:

\`\`\`yaml
${currentSchema}
\`\`\`

Please modify it according to these instructions: ${instructions}

Remember to output the COMPLETE modified schema, not just the changes.`;
	}
}
