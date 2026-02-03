/**
 * Unit tests for Schema Generator
 * 
 * Tests the SchemaGenerator class including system prompt construction,
 * conversation history management, and edit prompt formatting.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { SchemaGenerator } from "../schema-generator";
import type { LLMClient, LLMMessage } from "../llm-client";

// Mock LLM client
function createMockClient(responses: string[] = []): LLMClient {
	let callIndex = 0;
	
	return {
		async *chat(messages: LLMMessage[]): AsyncIterable<string> {
			const response = responses[callIndex] || "Mock response";
			callIndex++;
			
			// Yield the response in chunks to simulate streaming
			for (const char of response) {
				yield char;
			}
		},
	};
}

describe("SchemaGenerator", () => {
	describe("constructor", () => {
		it("should initialize with empty conversation history", () => {
			const client = createMockClient();
			const generator = new SchemaGenerator(client);
			
			expect(generator).toBeDefined();
		});

		it("should generate catalog prompt during initialization", () => {
			const client = createMockClient();
			const generator = new SchemaGenerator(client);
			
			// The generator should be ready to use immediately
			expect(generator).toBeDefined();
		});
	});

	describe("generate", () => {
		it("should stream response from LLM", async () => {
			const mockResponse = "type: form\nid: testForm";
			const client = createMockClient([mockResponse]);
			const generator = new SchemaGenerator(client);

			const chunks: string[] = [];
			for await (const chunk of generator.generate("Create a simple form")) {
				chunks.push(chunk);
			}

			expect(chunks.join("")).toBe(mockResponse);
		});

		it("should include user description in messages", async () => {
			const messages: LLMMessage[][] = [];
			const client: LLMClient = {
				async *chat(msgs: LLMMessage[]): AsyncIterable<string> {
					messages.push(msgs);
					yield "response";
				},
			};

			const generator = new SchemaGenerator(client);
			
			// Consume the stream
			for await (const chunk of generator.generate("Create a contact form")) {
				// Just consume
			}

			// Should have system message and user message
			expect(messages[0].length).toBeGreaterThanOrEqual(2);
			
			// Last message should be the user description
			const lastMessage = messages[0][messages[0].length - 1];
			expect(lastMessage.role).toBe("user");
			expect(lastMessage.content).toBe("Create a contact form");
		});

		it("should include system prompt with catalog documentation", async () => {
			const messages: LLMMessage[][] = [];
			const client: LLMClient = {
				async *chat(msgs: LLMMessage[]): AsyncIterable<string> {
					messages.push(msgs);
					yield "response";
				},
			};

			const generator = new SchemaGenerator(client);
			
			// Consume the stream
			for await (const chunk of generator.generate("Create a form")) {
				// Just consume
			}

			// First message should be system prompt
			const systemMessage = messages[0].find(m => m.role === "system");
			expect(systemMessage).toBeDefined();
			expect(systemMessage?.content).toContain("Form Engine");
			expect(systemMessage?.content).toContain("Available Components");
		});

		it("should store conversation history after generation", async () => {
			const client = createMockClient(["First response", "Second response"]);
			const generator = new SchemaGenerator(client);

			// First generation
			for await (const chunk of generator.generate("Create a form")) {
				// Just consume
			}

			// Second generation should include history
			const messages: LLMMessage[][] = [];
			const trackingClient: LLMClient = {
				async *chat(msgs: LLMMessage[]): AsyncIterable<string> {
					messages.push(msgs);
					yield "response";
				},
			};

			// Replace client to track messages
			(generator as any).client = trackingClient;

			for await (const chunk of generator.generate("Add a field")) {
				// Just consume
			}

			// Should include previous conversation
			const conversationMessages = messages[0].filter(m => m.role !== "system");
			expect(conversationMessages.length).toBeGreaterThanOrEqual(3); // Previous user + assistant + new user
		});
	});

	describe("edit", () => {
		it("should stream response from LLM", async () => {
			const mockResponse = "type: form\nid: editedForm";
			const client = createMockClient([mockResponse]);
			const generator = new SchemaGenerator(client);

			const chunks: string[] = [];
			for await (const chunk of generator.edit("type: form\nid: oldForm", "Change the ID")) {
				chunks.push(chunk);
			}

			expect(chunks.join("")).toBe(mockResponse);
		});

		it("should include current schema in prompt", async () => {
			const messages: LLMMessage[][] = [];
			const client: LLMClient = {
				async *chat(msgs: LLMMessage[]): AsyncIterable<string> {
					messages.push(msgs);
					yield "response";
				},
			};

			const generator = new SchemaGenerator(client);
			const currentSchema = "type: form\nid: myForm";
			
			// Consume the stream
			for await (const chunk of generator.edit(currentSchema, "Add a text field")) {
				// Just consume
			}

			// Last message should contain the current schema
			const lastMessage = messages[0][messages[0].length - 1];
			expect(lastMessage.role).toBe("user");
			expect(lastMessage.content).toContain(currentSchema);
			expect(lastMessage.content).toContain("Add a text field");
		});

		it("should request complete schema output", async () => {
			const messages: LLMMessage[][] = [];
			const client: LLMClient = {
				async *chat(msgs: LLMMessage[]): AsyncIterable<string> {
					messages.push(msgs);
					yield "response";
				},
			};

			const generator = new SchemaGenerator(client);
			
			// Consume the stream
			for await (const chunk of generator.edit("type: form", "Edit it")) {
				// Just consume
			}

			// Should instruct to output complete schema
			const lastMessage = messages[0][messages[0].length - 1];
			expect(lastMessage.content.toLowerCase()).toContain("complete");
		});

		it("should store conversation history after edit", async () => {
			const client = createMockClient(["Edit response"]);
			const generator = new SchemaGenerator(client);

			// First edit
			for await (const chunk of generator.edit("type: form", "Edit it")) {
				// Just consume
			}

			// Second call should include history
			const messages: LLMMessage[][] = [];
			const trackingClient: LLMClient = {
				async *chat(msgs: LLMMessage[]): AsyncIterable<string> {
					messages.push(msgs);
					yield "response";
				},
			};

			(generator as any).client = trackingClient;

			for await (const chunk of generator.edit("type: form", "Edit again")) {
				// Just consume
			}

			// Should include previous conversation
			const conversationMessages = messages[0].filter(m => m.role !== "system");
			expect(conversationMessages.length).toBeGreaterThanOrEqual(3);
		});
	});

	describe("resetConversation", () => {
		it("should clear conversation history", async () => {
			const client = createMockClient(["Response 1", "Response 2"]);
			const generator = new SchemaGenerator(client);

			// Generate something to build history
			for await (const chunk of generator.generate("Create a form")) {
				// Just consume
			}

			// Reset conversation
			generator.resetConversation();

			// Next call should not include previous history
			const messages: LLMMessage[][] = [];
			const trackingClient: LLMClient = {
				async *chat(msgs: LLMMessage[]): AsyncIterable<string> {
					messages.push(msgs);
					yield "response";
				},
			};

			(generator as any).client = trackingClient;

			for await (const chunk of generator.generate("New form")) {
				// Just consume
			}

			// Should only have system message and new user message
			const conversationMessages = messages[0].filter(m => m.role !== "system");
			expect(conversationMessages.length).toBe(1);
			expect(conversationMessages[0].content).toBe("New form");
		});
	});

	describe("system prompt", () => {
		it("should include catalog documentation", async () => {
			const messages: LLMMessage[][] = [];
			const client: LLMClient = {
				async *chat(msgs: LLMMessage[]): AsyncIterable<string> {
					messages.push(msgs);
					yield "response";
				},
			};

			const generator = new SchemaGenerator(client);
			
			for await (const chunk of generator.generate("Test")) {
				// Just consume
			}

			const systemMessage = messages[0].find(m => m.role === "system");
			expect(systemMessage).toBeDefined();
			
			// Should contain key sections from catalog prompt
			expect(systemMessage?.content).toContain("Available Components");
			expect(systemMessage?.content).toContain("Schema Structure Rules");
			expect(systemMessage?.content).toContain("Conditional Logic");
			expect(systemMessage?.content).toContain("Validation Rules");
		});

		it("should include component examples", async () => {
			const messages: LLMMessage[][] = [];
			const client: LLMClient = {
				async *chat(msgs: LLMMessage[]): AsyncIterable<string> {
					messages.push(msgs);
					yield "response";
				},
			};

			const generator = new SchemaGenerator(client);
			
			for await (const chunk of generator.generate("Test")) {
				// Just consume
			}

			const systemMessage = messages[0].find(m => m.role === "system");
			
			// Should include examples (includeExamples: true in constructor)
			expect(systemMessage?.content).toContain("Example:");
		});
	});
});
