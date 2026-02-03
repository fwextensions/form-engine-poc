/**
 * Property-Based Tests for Schema Generator
 * 
 * Feature: llm-integration
 * - Property 4: System Prompt Contains Catalog
 * - Property 5: Conversation History Maintenance
 * - Property 6: Edit Prompt Includes Current Schema
 * 
 * Validates: Requirements 3.1, 3.3, 3.4
 * 
 * Tests that the SchemaGenerator correctly builds prompts with catalog documentation,
 * maintains conversation history across multiple interactions, and includes current
 * schema context when editing.
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { SchemaGenerator } from "../schema-generator";
import type { LLMClient, LLMMessage } from "../llm-client";

// Configure fast-check
fc.configureGlobal({
  numRuns: 100,
});

/**
 * Creates a mock LLM client that captures messages and returns predefined responses.
 */
function createCapturingClient(responses: string[] = []): {
  client: LLMClient;
  capturedMessages: LLMMessage[][];
} {
  const capturedMessages: LLMMessage[][] = [];
  let callIndex = 0;

  const client: LLMClient = {
    async *chat(messages: LLMMessage[]): AsyncIterable<string> {
      // Capture the messages
      capturedMessages.push([...messages]);

      // Return the corresponding response
      const response = responses[callIndex] || "Mock response";
      callIndex++;

      // Yield the response
      yield response;
    },
  };

  return { client, capturedMessages };
}

/**
 * Consumes an async iterable and returns the concatenated result.
 */
async function consumeStream(stream: AsyncIterable<string>): Promise<string> {
  let result = "";
  for await (const chunk of stream) {
    result += chunk;
  }
  return result;
}

describe("Schema Generator - Property-Based Tests", () => {
  describe("Property 4: System Prompt Contains Catalog", () => {
    /**
     * **Validates: Requirements 3.1**
     * 
     * For any SchemaGenerator instance, when generating a new schema,
     * the system prompt passed to the LLM SHALL contain the catalog documentation.
     */

    it("should always include system message with catalog documentation in generate()", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 200 }),
          async (description) => {
            const { client, capturedMessages } = createCapturingClient(["response"]);
            const generator = new SchemaGenerator(client);

            await consumeStream(generator.generate(description));

            // Should have captured one call
            expect(capturedMessages.length).toBe(1);

            const messages = capturedMessages[0];

            // Should have at least a system message and user message
            expect(messages.length).toBeGreaterThanOrEqual(2);

            // First message should be system message
            const systemMessage = messages.find((m) => m.role === "system");
            expect(systemMessage).toBeDefined();

            // System message should contain catalog documentation
            expect(systemMessage?.content).toContain("Form Engine");
            expect(systemMessage?.content).toContain("Available Components");
          }
        )
      );
    });

    it("should include catalog documentation with component types", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 200 }),
          async (description) => {
            const { client, capturedMessages } = createCapturingClient(["response"]);
            const generator = new SchemaGenerator(client);

            await consumeStream(generator.generate(description));

            const systemMessage = capturedMessages[0].find((m) => m.role === "system");

            // Should contain documentation for common component types
            const content = systemMessage?.content || "";
            
            // Should have sections about components and schema structure
            expect(content).toContain("Schema Structure Rules");
            expect(content).toContain("Conditional Logic");
            expect(content).toContain("Validation Rules");
          }
        )
      );
    });

    it("should include system prompt in edit() operations", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.string({ minLength: 1, maxLength: 200 }),
          async (currentSchema, instructions) => {
            const { client, capturedMessages } = createCapturingClient(["response"]);
            const generator = new SchemaGenerator(client);

            await consumeStream(generator.edit(currentSchema, instructions));

            // Should have system message
            const systemMessage = capturedMessages[0].find((m) => m.role === "system");
            expect(systemMessage).toBeDefined();

            // Should contain catalog documentation
            expect(systemMessage?.content).toContain("Form Engine");
            expect(systemMessage?.content).toContain("Available Components");
          }
        )
      );
    });

    it("should use same catalog prompt for multiple generate() calls", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 2, maxLength: 5 }),
          async (descriptions) => {
            const responses = descriptions.map(() => "response");
            const { client, capturedMessages } = createCapturingClient(responses);
            const generator = new SchemaGenerator(client);

            // Make multiple generate calls
            for (const description of descriptions) {
              await consumeStream(generator.generate(description));
            }

            // Extract all system messages
            const systemMessages = capturedMessages.map((msgs) =>
              msgs.find((m) => m.role === "system")?.content
            );

            // All system messages should be identical
            for (let i = 1; i < systemMessages.length; i++) {
              expect(systemMessages[i]).toBe(systemMessages[0]);
            }
          }
        )
      );
    });

    it("should include examples in catalog prompt", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 200 }),
          async (description) => {
            const { client, capturedMessages } = createCapturingClient(["response"]);
            const generator = new SchemaGenerator(client);

            await consumeStream(generator.generate(description));

            const systemMessage = capturedMessages[0].find((m) => m.role === "system");

            // Should include examples (includeExamples: true in constructor)
            expect(systemMessage?.content).toContain("Example:");
          }
        )
      );
    });
  });

  describe("Property 5: Conversation History Maintenance", () => {
    /**
     * **Validates: Requirements 3.3**
     * 
     * For any sequence of generate/edit calls on a SchemaGenerator,
     * the conversation history SHALL contain all previous user prompts
     * and assistant responses in order.
     */

    it("should maintain history after single generate() call", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.string({ minLength: 1, maxLength: 200 }),
          async (firstPrompt, secondPrompt) => {
            const { client, capturedMessages } = createCapturingClient([
              "First response",
              "Second response",
            ]);
            const generator = new SchemaGenerator(client);

            // First call
            await consumeStream(generator.generate(firstPrompt));

            // Second call
            await consumeStream(generator.generate(secondPrompt));

            // Second call should include history from first call
            const secondCallMessages = capturedMessages[1];

            // Filter out system messages to get conversation
            const conversationMessages = secondCallMessages.filter(
              (m) => m.role !== "system"
            );

            // Should have: first user, first assistant, second user
            expect(conversationMessages.length).toBeGreaterThanOrEqual(3);

            // Check order: user -> assistant -> user
            expect(conversationMessages[0].role).toBe("user");
            expect(conversationMessages[0].content).toBe(firstPrompt);

            expect(conversationMessages[1].role).toBe("assistant");
            expect(conversationMessages[1].content).toBe("First response");

            expect(conversationMessages[conversationMessages.length - 1].role).toBe("user");
            expect(conversationMessages[conversationMessages.length - 1].content).toBe(
              secondPrompt
            );
          }
        )
      );
    });

    it("should maintain history across multiple generate() calls", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 2, maxLength: 5 }),
          async (prompts) => {
            const responses = prompts.map((_, i) => `Response ${i}`);
            const { client, capturedMessages } = createCapturingClient(responses);
            const generator = new SchemaGenerator(client);

            // Make all generate calls
            for (const prompt of prompts) {
              await consumeStream(generator.generate(prompt));
            }

            // Check the last call has all history
            const lastCallMessages = capturedMessages[capturedMessages.length - 1];
            const conversationMessages = lastCallMessages.filter(
              (m) => m.role !== "system"
            );

            // Should have 2 messages per previous call + 1 for current
            const expectedCount = (prompts.length - 1) * 2 + 1;
            expect(conversationMessages.length).toBe(expectedCount);

            // Verify all prompts are in history
            const userMessages = conversationMessages.filter((m) => m.role === "user");
            expect(userMessages.length).toBe(prompts.length);

            for (let i = 0; i < prompts.length; i++) {
              expect(userMessages[i].content).toBe(prompts[i]);
            }
          }
        )
      );
    });

    it("should maintain history after edit() calls", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.string({ minLength: 1, maxLength: 200 }),
          async (schema, firstInstructions, secondInstructions) => {
            const { client, capturedMessages } = createCapturingClient([
              "First edit response",
              "Second edit response",
            ]);
            const generator = new SchemaGenerator(client);

            // First edit
            await consumeStream(generator.edit(schema, firstInstructions));

            // Second edit
            await consumeStream(generator.edit(schema, secondInstructions));

            // Second call should include history
            const secondCallMessages = capturedMessages[1];
            const conversationMessages = secondCallMessages.filter(
              (m) => m.role !== "system"
            );

            // Should have at least 3 messages: first user, first assistant, second user
            expect(conversationMessages.length).toBeGreaterThanOrEqual(3);

            // First should be user message
            expect(conversationMessages[0].role).toBe("user");

            // Second should be assistant response
            expect(conversationMessages[1].role).toBe("assistant");
            expect(conversationMessages[1].content).toBe("First edit response");
          }
        )
      );
    });

    it("should maintain history across mixed generate() and edit() calls", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          async (generatePrompt, schema, editInstructions) => {
            const { client, capturedMessages } = createCapturingClient([
              "Generate response",
              "Edit response",
            ]);
            const generator = new SchemaGenerator(client);

            // Generate
            await consumeStream(generator.generate(generatePrompt));

            // Edit
            await consumeStream(generator.edit(schema, editInstructions));

            // Edit call should include generate history
            const editCallMessages = capturedMessages[1];
            const conversationMessages = editCallMessages.filter(
              (m) => m.role !== "system"
            );

            // Should have: generate user, generate assistant, edit user
            expect(conversationMessages.length).toBeGreaterThanOrEqual(3);

            expect(conversationMessages[0].role).toBe("user");
            expect(conversationMessages[0].content).toBe(generatePrompt);

            expect(conversationMessages[1].role).toBe("assistant");
            expect(conversationMessages[1].content).toBe("Generate response");
          }
        )
      );
    });

    it("should preserve message order in history", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 3, maxLength: 10 }),
          async (prompts) => {
            const responses = prompts.map((_, i) => `Response ${i}`);
            const { client, capturedMessages } = createCapturingClient(responses);
            const generator = new SchemaGenerator(client);

            // Make all calls
            for (const prompt of prompts) {
              await consumeStream(generator.generate(prompt));
            }

            // Check last call has correct order
            const lastCallMessages = capturedMessages[capturedMessages.length - 1];
            const conversationMessages = lastCallMessages.filter(
              (m) => m.role !== "system"
            );

            // Verify alternating user/assistant pattern
            for (let i = 0; i < conversationMessages.length - 1; i += 2) {
              expect(conversationMessages[i].role).toBe("user");
              expect(conversationMessages[i + 1].role).toBe("assistant");
            }
          }
        )
      );
    });

    it("should clear history after resetConversation()", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 1, maxLength: 5 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          async (promptsBeforeReset, promptAfterReset) => {
            const allResponses = [
              ...promptsBeforeReset.map(() => "response"),
              "response after reset",
            ];
            const { client, capturedMessages } = createCapturingClient(allResponses);
            const generator = new SchemaGenerator(client);

            // Make calls before reset
            for (const prompt of promptsBeforeReset) {
              await consumeStream(generator.generate(prompt));
            }

            // Reset conversation
            generator.resetConversation();

            // Make call after reset
            await consumeStream(generator.generate(promptAfterReset));

            // Last call should only have the new prompt, no history
            const lastCallMessages =
              capturedMessages[capturedMessages.length - 1];
            const conversationMessages = lastCallMessages.filter(
              (m) => m.role !== "system"
            );

            // Should only have 1 message (the new prompt)
            expect(conversationMessages.length).toBe(1);
            expect(conversationMessages[0].role).toBe("user");
            expect(conversationMessages[0].content).toBe(promptAfterReset);
          }
        )
      );
    });

    it("should accumulate history correctly with long conversation chains", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 5, max: 20 }),
          async (numTurns) => {
            const prompts = Array.from({ length: numTurns }, (_, i) => `Prompt ${i}`);
            const responses = prompts.map((_, i) => `Response ${i}`);
            const { client, capturedMessages } = createCapturingClient(responses);
            const generator = new SchemaGenerator(client);

            // Make all calls
            for (const prompt of prompts) {
              await consumeStream(generator.generate(prompt));
            }

            // Verify each call has correct history length
            for (let i = 0; i < capturedMessages.length; i++) {
              const conversationMessages = capturedMessages[i].filter(
                (m) => m.role !== "system"
              );

              // Should have i previous turns (2 messages each) + 1 current user message
              const expectedCount = i * 2 + 1;
              expect(conversationMessages.length).toBe(expectedCount);
            }
          }
        )
      );
    });
  });

  describe("Property 6: Edit Prompt Includes Current Schema", () => {
    /**
     * **Validates: Requirements 3.4**
     * 
     * For any edit operation with a non-empty current schema,
     * the user message sent to the LLM SHALL contain the current
     * schema wrapped in a code block.
     */

    it("should include current schema in edit prompt", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 500 }),
          fc.string({ minLength: 1, maxLength: 200 }),
          async (currentSchema, instructions) => {
            const { client, capturedMessages } = createCapturingClient(["response"]);
            const generator = new SchemaGenerator(client);

            await consumeStream(generator.edit(currentSchema, instructions));

            // Get the user message (last message)
            const messages = capturedMessages[0];
            const userMessage = messages[messages.length - 1];

            expect(userMessage.role).toBe("user");
            expect(userMessage.content).toContain(currentSchema);
          }
        )
      );
    });

    it("should wrap schema in code block", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 500 }).filter(s => !s.includes("```")),
          fc.string({ minLength: 1, maxLength: 200 }),
          async (currentSchema, instructions) => {
            const { client, capturedMessages } = createCapturingClient(["response"]);
            const generator = new SchemaGenerator(client);

            await consumeStream(generator.edit(currentSchema, instructions));

            const userMessage = capturedMessages[0][capturedMessages[0].length - 1];

            // Should contain code block markers
            expect(userMessage.content).toContain("```");
            
            // Schema should be between code blocks
            const codeBlockRegex = /```(?:yaml)?\s*\n([\s\S]*?)\n```/;
            const match = userMessage.content.match(codeBlockRegex);
            
            expect(match).toBeTruthy();
            expect(match?.[1]).toContain(currentSchema);
          }
        )
      );
    });

    it("should include instructions in edit prompt", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 500 }),
          fc.string({ minLength: 1, maxLength: 200 }),
          async (currentSchema, instructions) => {
            const { client, capturedMessages } = createCapturingClient(["response"]);
            const generator = new SchemaGenerator(client);

            await consumeStream(generator.edit(currentSchema, instructions));

            const userMessage = capturedMessages[0][capturedMessages[0].length - 1];

            expect(userMessage.content).toContain(instructions);
          }
        )
      );
    });

    it("should request complete schema output", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 500 }),
          fc.string({ minLength: 1, maxLength: 200 }),
          async (currentSchema, instructions) => {
            const { client, capturedMessages } = createCapturingClient(["response"]);
            const generator = new SchemaGenerator(client);

            await consumeStream(generator.edit(currentSchema, instructions));

            const userMessage = capturedMessages[0][capturedMessages[0].length - 1];

            // Should instruct to output complete schema
            expect(userMessage.content.toLowerCase()).toContain("complete");
          }
        )
      );
    });

    it("should handle schemas with special characters", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 500 }),
          fc.string({ minLength: 1, maxLength: 200 }),
          async (currentSchema, instructions) => {
            const { client, capturedMessages } = createCapturingClient(["response"]);
            const generator = new SchemaGenerator(client);

            await consumeStream(generator.edit(currentSchema, instructions));

            const userMessage = capturedMessages[0][capturedMessages[0].length - 1];

            // Schema should be preserved exactly
            expect(userMessage.content).toContain(currentSchema);
          }
        )
      );
    });

    it("should handle multi-line schemas", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 2, maxLength: 10 }),
          fc.string({ minLength: 1, maxLength: 200 }),
          async (schemaLines, instructions) => {
            const currentSchema = schemaLines.join("\n");
            const { client, capturedMessages } = createCapturingClient(["response"]);
            const generator = new SchemaGenerator(client);

            await consumeStream(generator.edit(currentSchema, instructions));

            const userMessage = capturedMessages[0][capturedMessages[0].length - 1];

            // All lines should be present
            for (const line of schemaLines) {
              expect(userMessage.content).toContain(line);
            }
          }
        )
      );
    });

    it("should handle empty schema gracefully", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 200 }),
          async (instructions) => {
            const { client, capturedMessages } = createCapturingClient(["response"]);
            const generator = new SchemaGenerator(client);

            // Edit with empty schema
            await consumeStream(generator.edit("", instructions));

            const userMessage = capturedMessages[0][capturedMessages[0].length - 1];

            // Should still include instructions
            expect(userMessage.content).toContain(instructions);
          }
        )
      );
    });

    it("should preserve schema content exactly without modification", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 500 }).filter(s => !s.includes("```")),
          fc.string({ minLength: 1, maxLength: 200 }),
          async (currentSchema, instructions) => {
            const { client, capturedMessages } = createCapturingClient(["response"]);
            const generator = new SchemaGenerator(client);

            await consumeStream(generator.edit(currentSchema, instructions));

            const userMessage = capturedMessages[0][capturedMessages[0].length - 1];

            // Extract schema from code block
            const codeBlockRegex = /```(?:yaml)?\s*\n([\s\S]*?)\n```/;
            const match = userMessage.content.match(codeBlockRegex);

            // Schema should be exactly as provided (trimmed)
            expect(match?.[1].trim()).toBe(currentSchema.trim());
          }
        )
      );
    });
  });
});
