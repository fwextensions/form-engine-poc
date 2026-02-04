/**
 * LLM Client Abstraction
 * 
 * Provides an abstract interface for communicating with LLM providers
 * with streaming support via Server-Sent Events (SSE).
 */

export interface LLMMessage {
	role: "user" | "assistant" | "system";
	content: string;
}

export interface LLMClientConfig {
	apiKey: string;
	model?: string;
	maxTokens?: number;
}

export interface LLMClient {
	/**
	 * Sends messages to the LLM and returns a streaming response.
	 * Yields string chunks as they arrive.
	 */
	chat(messages: LLMMessage[]): AsyncIterable<string>;
}

/**
 * Creates an Anthropic Claude client with SSE streaming.
 * Uses the Next.js API proxy to avoid CORS issues.
 * 
 * @param config - Configuration including API key, model, and max tokens
 * @returns LLMClient instance that streams responses via SSE
 */
export function createAnthropicClient(config: LLMClientConfig): LLMClient {
	const {
		apiKey,
		model = "claude-haiku-4-5-20251001",
		maxTokens = 4096,
	} = config;

	return {
		async *chat(messages: LLMMessage[]): AsyncIterable<string> {
			// Separate system messages from user/assistant messages
			const systemMessages = messages.filter(m => m.role === "system");
			const conversationMessages = messages.filter(m => m.role !== "system");

			// Anthropic API expects a single system parameter
			const systemPrompt = systemMessages.map(m => m.content).join("\n\n");

			// Build messages array for the API
			const apiMessages = conversationMessages.map(m => ({
				role: m.role,
				content: m.content,
			}));

			// Add system message if present
			if (systemPrompt) {
				apiMessages.unshift({
					role: "system" as const,
					content: systemPrompt,
				});
			}

			// Build request body for the proxy endpoint
			const requestBody = {
				provider: "anthropic",
				apiKey,
				model,
				messages: apiMessages,
				stream: true,
			};

			let response: Response;
			try {
				response = await fetch("/api/llm", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(requestBody),
				});
			} catch (error) {
				throw new Error("Network error: Unable to connect to LLM service");
			}

			// Handle HTTP errors
			if (!response.ok) {
				const errorText = await response.text().catch(() => "Unknown error");
				
				if (response.status === 401) {
					throw new Error("Authentication failed: Please check your API key");
				} else if (response.status === 429) {
					throw new Error("Rate limit exceeded: Please wait before retrying");
				} else if (response.status >= 500) {
					throw new Error("Server error: The LLM service is temporarily unavailable");
				} else {
					throw new Error(`API error (${response.status}): ${errorText}`);
				}
			}

			// Parse SSE stream
			const reader = response.body?.getReader();
			if (!reader) {
				throw new Error("Invalid response: Unable to parse LLM response");
			}

			const decoder = new TextDecoder();
			let buffer = "";

			try {
				while (true) {
					const { done, value } = await reader.read();
					
					if (done) {
						break;
					}

					// Decode chunk and add to buffer
					buffer += decoder.decode(value, { stream: true });

					// Process complete SSE events (lines ending with \n\n)
					const lines = buffer.split("\n");
					
					// Keep the last incomplete line in the buffer
					buffer = lines.pop() || "";

					for (const line of lines) {
						// Skip empty lines and comments
						if (!line.trim() || line.startsWith(":")) {
							continue;
						}

						// Parse SSE event format: "data: {...}"
						if (line.startsWith("data: ")) {
							const data = line.slice(6); // Remove "data: " prefix

							// Handle stream end marker
							if (data === "[DONE]") {
								return;
							}

							try {
								const event = JSON.parse(data);

								// Handle different event types from Anthropic streaming
								if (event.type === "content_block_delta") {
									// Extract text delta from content block
									if (event.delta?.type === "text_delta" && event.delta?.text) {
										yield event.delta.text;
									}
								} else if (event.type === "error") {
									// Handle streaming errors
									throw new Error(`API error: ${event.error?.message || "Unknown error"}`);
								}
								// Ignore other event types (message_start, content_block_start, content_block_stop, message_delta, message_stop)
							} catch (parseError) {
								// Re-throw if it's an API error (not a JSON parse error)
								if (parseError instanceof Error && parseError.message.startsWith("API error:")) {
									throw parseError;
								}
								// If JSON parsing fails, skip this event
								console.warn("Failed to parse SSE event:", data);
							}
						}
					}
				}
			} finally {
				reader.releaseLock();
			}
		},
	};
}
