/**
 * Unit tests for LLM Client
 * 
 * Tests the LLM client interface and Anthropic implementation
 * including SSE parsing, error handling, and message formatting.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createAnthropicClient, type LLMMessage } from "../llm-client";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

// Helper to create a mock ReadableStream from SSE events
function createMockStream(events: string[]): ReadableStream<Uint8Array> {
	const encoder = new TextEncoder();
	let index = 0;

	return new ReadableStream({
		async pull(controller) {
			if (index < events.length) {
				controller.enqueue(encoder.encode(events[index]));
				index++;
			} else {
				controller.close();
			}
		},
	});
}

describe("LLM Client", () => {
	beforeEach(() => {
		mockFetch.mockReset();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("createAnthropicClient", () => {
		it("should create a client with default model and maxTokens", () => {
			const client = createAnthropicClient({ apiKey: "test-key" });
			expect(client).toBeDefined();
			expect(client.chat).toBeDefined();
		});

		it("should use custom model and maxTokens when provided", async () => {
			const events = [
				'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello"}}\n\n',
			];

			mockFetch.mockResolvedValue({
				ok: true,
				body: createMockStream(events),
			});

			const client = createAnthropicClient({
				apiKey: "test-key",
				model: "claude-3-opus-20240229",
				maxTokens: 2048,
			});

			const messages: LLMMessage[] = [{ role: "user", content: "Hi" }];
			
			// Consume the stream
			for await (const chunk of client.chat(messages)) {
				// Just consume
			}

			expect(mockFetch).toHaveBeenCalledWith(
				"https://api.anthropic.com/v1/messages",
				expect.objectContaining({
					method: "POST",
					headers: expect.objectContaining({
						"x-api-key": "test-key",
					}),
					body: expect.stringContaining('"model":"claude-3-opus-20240229"'),
				})
			);

			const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
			expect(requestBody.max_tokens).toBe(2048);
		});

		it("should separate system messages from conversation messages", async () => {
			const events = [
				'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Response"}}\n\n',
			];

			mockFetch.mockResolvedValue({
				ok: true,
				body: createMockStream(events),
			});

			const client = createAnthropicClient({ apiKey: "test-key" });

			const messages: LLMMessage[] = [
				{ role: "system", content: "You are a helpful assistant" },
				{ role: "user", content: "Hello" },
				{ role: "assistant", content: "Hi there" },
				{ role: "user", content: "How are you?" },
			];

			// Consume the stream
			for await (const chunk of client.chat(messages)) {
				// Just consume
			}

			const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
			
			// System message should be in system parameter
			expect(requestBody.system).toBe("You are a helpful assistant");
			
			// Only user/assistant messages should be in messages array
			expect(requestBody.messages).toHaveLength(3);
			expect(requestBody.messages[0].role).toBe("user");
			expect(requestBody.messages[1].role).toBe("assistant");
			expect(requestBody.messages[2].role).toBe("user");
		});

		it("should stream text delta chunks from SSE events", async () => {
			const events = [
				'data: {"type":"message_start","message":{"id":"msg_123"}}\n\n',
				'data: {"type":"content_block_start","index":0}\n\n',
				'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello"}}\n\n',
				'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":" world"}}\n\n',
				'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"!"}}\n\n',
				'data: {"type":"content_block_stop","index":0}\n\n',
				'data: {"type":"message_stop"}\n\n',
			];

			mockFetch.mockResolvedValue({
				ok: true,
				body: createMockStream(events),
			});

			const client = createAnthropicClient({ apiKey: "test-key" });
			const messages: LLMMessage[] = [{ role: "user", content: "Say hello" }];

			const chunks: string[] = [];
			for await (const chunk of client.chat(messages)) {
				chunks.push(chunk);
			}

			expect(chunks).toEqual(["Hello", " world", "!"]);
		});

		it("should handle network errors", async () => {
			mockFetch.mockRejectedValue(new Error("Network failure"));

			const client = createAnthropicClient({ apiKey: "test-key" });
			const messages: LLMMessage[] = [{ role: "user", content: "Hi" }];

			await expect(async () => {
				for await (const chunk of client.chat(messages)) {
					// Should not reach here
				}
			}).rejects.toThrow("Network error: Unable to connect to LLM service");
		});

		it("should handle 401 authentication errors", async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				status: 401,
				text: async () => "Invalid API key",
			});

			const client = createAnthropicClient({ apiKey: "invalid-key" });
			const messages: LLMMessage[] = [{ role: "user", content: "Hi" }];

			await expect(async () => {
				for await (const chunk of client.chat(messages)) {
					// Should not reach here
				}
			}).rejects.toThrow("Authentication failed: Please check your API key");
		});

		it("should handle 429 rate limit errors", async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				status: 429,
				text: async () => "Rate limit exceeded",
			});

			const client = createAnthropicClient({ apiKey: "test-key" });
			const messages: LLMMessage[] = [{ role: "user", content: "Hi" }];

			await expect(async () => {
				for await (const chunk of client.chat(messages)) {
					// Should not reach here
				}
			}).rejects.toThrow("Rate limit exceeded: Please wait before retrying");
		});

		it("should handle 500 server errors", async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				status: 500,
				text: async () => "Internal server error",
			});

			const client = createAnthropicClient({ apiKey: "test-key" });
			const messages: LLMMessage[] = [{ role: "user", content: "Hi" }];

			await expect(async () => {
				for await (const chunk of client.chat(messages)) {
					// Should not reach here
				}
			}).rejects.toThrow("Server error: The LLM service is temporarily unavailable");
		});

		it("should handle missing response body", async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				body: null,
			});

			const client = createAnthropicClient({ apiKey: "test-key" });
			const messages: LLMMessage[] = [{ role: "user", content: "Hi" }];

			await expect(async () => {
				for await (const chunk of client.chat(messages)) {
					// Should not reach here
				}
			}).rejects.toThrow("Invalid response: Unable to parse LLM response");
		});

		it("should handle streaming error events", async () => {
			const events = [
				'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello"}}\n\n',
				'data: {"type":"error","error":{"message":"Something went wrong"}}\n\n',
			];

			mockFetch.mockResolvedValue({
				ok: true,
				body: createMockStream(events),
			});

			const client = createAnthropicClient({ apiKey: "test-key" });
			const messages: LLMMessage[] = [{ role: "user", content: "Hi" }];

			await expect(async () => {
				for await (const chunk of client.chat(messages)) {
					// Should throw after first chunk
				}
			}).rejects.toThrow("API error: Something went wrong");
		});

		it("should skip empty lines and comments in SSE stream", async () => {
			const events = [
				'\n',
				': this is a comment\n',
				'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello"}}\n\n',
				'\n',
				': another comment\n',
				'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":" world"}}\n\n',
			];

			mockFetch.mockResolvedValue({
				ok: true,
				body: createMockStream(events),
			});

			const client = createAnthropicClient({ apiKey: "test-key" });
			const messages: LLMMessage[] = [{ role: "user", content: "Hi" }];

			const chunks: string[] = [];
			for await (const chunk of client.chat(messages)) {
				chunks.push(chunk);
			}

			expect(chunks).toEqual(["Hello", " world"]);
		});

		it("should handle [DONE] marker", async () => {
			const events = [
				'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello"}}\n\n',
				'data: [DONE]\n\n',
			];

			mockFetch.mockResolvedValue({
				ok: true,
				body: createMockStream(events),
			});

			const client = createAnthropicClient({ apiKey: "test-key" });
			const messages: LLMMessage[] = [{ role: "user", content: "Hi" }];

			const chunks: string[] = [];
			for await (const chunk of client.chat(messages)) {
				chunks.push(chunk);
			}

			expect(chunks).toEqual(["Hello"]);
		});

		it("should ignore non-text-delta events", async () => {
			const events = [
				'data: {"type":"message_start","message":{"id":"msg_123"}}\n\n',
				'data: {"type":"content_block_start","index":0}\n\n',
				'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello"}}\n\n',
				'data: {"type":"message_delta","delta":{"stop_reason":"end_turn"}}\n\n',
				'data: {"type":"content_block_stop","index":0}\n\n',
				'data: {"type":"message_stop"}\n\n',
			];

			mockFetch.mockResolvedValue({
				ok: true,
				body: createMockStream(events),
			});

			const client = createAnthropicClient({ apiKey: "test-key" });
			const messages: LLMMessage[] = [{ role: "user", content: "Hi" }];

			const chunks: string[] = [];
			for await (const chunk of client.chat(messages)) {
				chunks.push(chunk);
			}

			// Should only yield the text delta
			expect(chunks).toEqual(["Hello"]);
		});

		it("should handle malformed JSON in SSE events gracefully", async () => {
			const events = [
				'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello"}}\n\n',
				'data: {invalid json}\n\n',
				'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":" world"}}\n\n',
			];

			mockFetch.mockResolvedValue({
				ok: true,
				body: createMockStream(events),
			});

			const client = createAnthropicClient({ apiKey: "test-key" });
			const messages: LLMMessage[] = [{ role: "user", content: "Hi" }];

			const chunks: string[] = [];
			for await (const chunk of client.chat(messages)) {
				chunks.push(chunk);
			}

			// Should skip malformed event and continue
			expect(chunks).toEqual(["Hello", " world"]);
		});

		it("should handle multiple system messages by joining them", async () => {
			const events = [
				'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Response"}}\n\n',
			];

			mockFetch.mockResolvedValue({
				ok: true,
				body: createMockStream(events),
			});

			const client = createAnthropicClient({ apiKey: "test-key" });

			const messages: LLMMessage[] = [
				{ role: "system", content: "You are helpful" },
				{ role: "system", content: "You are concise" },
				{ role: "user", content: "Hello" },
			];

			// Consume the stream
			for await (const chunk of client.chat(messages)) {
				// Just consume
			}

			const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
			
			// System messages should be joined
			expect(requestBody.system).toBe("You are helpful\n\nYou are concise");
		});

		it("should handle empty messages array", async () => {
			const events = [
				'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Response"}}\n\n',
			];

			mockFetch.mockResolvedValue({
				ok: true,
				body: createMockStream(events),
			});

			const client = createAnthropicClient({ apiKey: "test-key" });
			const messages: LLMMessage[] = [];

			// Consume the stream
			for await (const chunk of client.chat(messages)) {
				// Just consume
			}

			const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
			expect(requestBody.messages).toEqual([]);
		});

		it("should set correct headers for Anthropic API", async () => {
			const events = [
				'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello"}}\n\n',
			];

			mockFetch.mockResolvedValue({
				ok: true,
				body: createMockStream(events),
			});

			const client = createAnthropicClient({ apiKey: "test-api-key-123" });
			const messages: LLMMessage[] = [{ role: "user", content: "Hi" }];

			// Consume the stream
			for await (const chunk of client.chat(messages)) {
				// Just consume
			}

			expect(mockFetch).toHaveBeenCalledWith(
				"https://api.anthropic.com/v1/messages",
				expect.objectContaining({
					headers: {
						"Content-Type": "application/json",
						"x-api-key": "test-api-key-123",
						"anthropic-version": "2023-06-01",
					},
				})
			);
		});

		it("should enable streaming in request body", async () => {
			const events = [
				'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello"}}\n\n',
			];

			mockFetch.mockResolvedValue({
				ok: true,
				body: createMockStream(events),
			});

			const client = createAnthropicClient({ apiKey: "test-key" });
			const messages: LLMMessage[] = [{ role: "user", content: "Hi" }];

			// Consume the stream
			for await (const chunk of client.chat(messages)) {
				// Just consume
			}

			const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
			expect(requestBody.stream).toBe(true);
		});
	});
});
