import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST, createProvider } from "../route";
import { streamText, APICallError } from "ai";

// Mock the Vercel AI SDK
vi.mock("ai", () => ({
	streamText: vi.fn(),
	tool: vi.fn(),
	APICallError: {
		isInstance: vi.fn(),
	},
}));

// Mock the provider SDKs
vi.mock("@ai-sdk/anthropic", () => ({
	createAnthropic: vi.fn(() => vi.fn()),
}));

vi.mock("@ai-sdk/openai", () => ({
	createOpenAI: vi.fn(() => vi.fn()),
}));

vi.mock("@ai-sdk/google", () => ({
	createGoogleGenerativeAI: vi.fn(() => vi.fn()),
}));

vi.mock("@ai-sdk/amazon-bedrock", () => ({
	createAmazonBedrock: vi.fn(() => vi.fn()),
}));

describe("LLM API Route", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("POST handler - Error Handling", () => {
		describe("Missing required fields (400 errors)", () => {
			it("should return 400 when provider is missing", async () => {
				const request = new NextRequest("http://localhost/api/llm", {
					method: "POST",
					body: JSON.stringify({
						model: "test-model",
						messages: [],
					}),
				});

				const response = await POST(request);
				const data = await response.json();

				expect(response.status).toBe(400);
				expect(data.error).toBe("Provider is required");
			});

			it("should return 400 when model is missing", async () => {
				const request = new NextRequest("http://localhost/api/llm", {
					method: "POST",
					body: JSON.stringify({
						provider: "anthropic",
						messages: [],
					}),
				});

				const response = await POST(request);
				const data = await response.json();

				expect(response.status).toBe(400);
				expect(data.error).toBe("Model is required");
			});

			it("should return 400 when API key is missing for Anthropic", async () => {
				const request = new NextRequest("http://localhost/api/llm", {
					method: "POST",
					body: JSON.stringify({
						provider: "anthropic",
						model: "claude-3-sonnet",
						messages: [],
					}),
				});

				const response = await POST(request);
				const data = await response.json();

				expect(response.status).toBe(400);
				expect(data.error).toBe("API key is required for Anthropic provider");
			});

			it("should return 400 when API key is missing for OpenAI", async () => {
				const request = new NextRequest("http://localhost/api/llm", {
					method: "POST",
					body: JSON.stringify({
						provider: "openai",
						model: "gpt-4",
						messages: [],
					}),
				});

				const response = await POST(request);
				const data = await response.json();

				expect(response.status).toBe(400);
				expect(data.error).toBe("API key is required for OpenAI provider");
			});

			it("should return 400 when API key is missing for Google", async () => {
				const request = new NextRequest("http://localhost/api/llm", {
					method: "POST",
					body: JSON.stringify({
						provider: "google",
						model: "gemini-pro",
						messages: [],
					}),
				});

				const response = await POST(request);
				const data = await response.json();

				expect(response.status).toBe(400);
				expect(data.error).toBe("API key is required for Google provider");
			});

			it("should return 400 when AWS credentials are missing for Bedrock", async () => {
				const request = new NextRequest("http://localhost/api/llm", {
					method: "POST",
					body: JSON.stringify({
						provider: "bedrock",
						model: "anthropic.claude-3",
						messages: [],
						awsAccessKeyId: "test-key",
						// Missing secretAccessKey and region
					}),
				});

				const response = await POST(request);
				const data = await response.json();

				expect(response.status).toBe(400);
				expect(data.error).toContain("AWS credentials");
			});

			it("should return 400 for unsupported provider", async () => {
				const request = new NextRequest("http://localhost/api/llm", {
					method: "POST",
					body: JSON.stringify({
						provider: "invalid-provider",
						model: "test-model",
						messages: [],
						apiKey: "test-key",
					}),
				});

				const response = await POST(request);
				const data = await response.json();

				expect(response.status).toBe(400);
				expect(data.error).toContain("Unsupported provider");
			});
		});

		describe("Authentication errors (401)", () => {
			it("should return 401 when API returns 401 status", async () => {
				const mockError = {
					statusCode: 401,
					message: "Invalid API key",
				};

				// Mock streamText to throw the error
				(streamText as any).mockImplementation(() => {
					throw mockError;
				});
				(APICallError.isInstance as any).mockReturnValue(true);

				const request = new NextRequest("http://localhost/api/llm", {
					method: "POST",
					body: JSON.stringify({
						provider: "anthropic",
						model: "claude-3-sonnet",
						messages: [{ role: "user", content: "test" }],
						apiKey: "invalid-key",
					}),
				});

				const response = await POST(request);
				const data = await response.json();

				expect(response.status).toBe(401);
				expect(data.error).toContain("Authentication failed");
			});

			it("should return 401 when API returns 403 status", async () => {
				const mockError = {
					statusCode: 403,
					message: "Forbidden",
				};

				(streamText as any).mockImplementation(() => {
					throw mockError;
				});
				(APICallError.isInstance as any).mockReturnValue(true);

				const request = new NextRequest("http://localhost/api/llm", {
					method: "POST",
					body: JSON.stringify({
						provider: "openai",
						model: "gpt-4",
						messages: [{ role: "user", content: "test" }],
						apiKey: "forbidden-key",
					}),
				});

				const response = await POST(request);
				const data = await response.json();

				expect(response.status).toBe(401);
				expect(data.error).toContain("Authentication failed");
			});
		});

		describe("Rate limit errors (429)", () => {
			it("should return 429 when API returns rate limit error", async () => {
				const mockError = {
					statusCode: 429,
					message: "Rate limit exceeded",
				};

				(streamText as any).mockImplementation(() => {
					throw mockError;
				});
				(APICallError.isInstance as any).mockReturnValue(true);

				const request = new NextRequest("http://localhost/api/llm", {
					method: "POST",
					body: JSON.stringify({
						provider: "anthropic",
						model: "claude-3-sonnet",
						messages: [{ role: "user", content: "test" }],
						apiKey: "test-key",
					}),
				});

				const response = await POST(request);
				const data = await response.json();

				expect(response.status).toBe(429);
				expect(data.error).toContain("Rate limit exceeded");
			});
		});

		describe("Server errors (500)", () => {
			it("should return 500 when API returns server error", async () => {
				const mockError = {
					statusCode: 500,
					message: "Internal server error",
				};

				(streamText as any).mockImplementation(() => {
					throw mockError;
				});
				(APICallError.isInstance as any).mockReturnValue(true);

				const request = new NextRequest("http://localhost/api/llm", {
					method: "POST",
					body: JSON.stringify({
						provider: "anthropic",
						model: "claude-3-sonnet",
						messages: [{ role: "user", content: "test" }],
						apiKey: "test-key",
					}),
				});

				const response = await POST(request);
				const data = await response.json();

				expect(response.status).toBe(500);
				expect(data.error).toContain("Server error");
			});

			it("should return 500 for unexpected errors", async () => {
				(streamText as any).mockImplementation(() => {
					throw new Error("Unexpected error");
				});
				(APICallError.isInstance as any).mockReturnValue(false);

				const request = new NextRequest("http://localhost/api/llm", {
					method: "POST",
					body: JSON.stringify({
						provider: "anthropic",
						model: "claude-3-sonnet",
						messages: [{ role: "user", content: "test" }],
						apiKey: "test-key",
					}),
				});

				const response = await POST(request);
				const data = await response.json();

				expect(response.status).toBe(500);
				expect(data.error).toBe("Unexpected error");
			});

			it("should return 500 with generic message for non-Error objects", async () => {
				(streamText as any).mockImplementation(() => {
					throw "string error";
				});
				(APICallError.isInstance as any).mockReturnValue(false);

				const request = new NextRequest("http://localhost/api/llm", {
					method: "POST",
					body: JSON.stringify({
						provider: "anthropic",
						model: "claude-3-sonnet",
						messages: [{ role: "user", content: "test" }],
						apiKey: "test-key",
					}),
				});

				const response = await POST(request);
				const data = await response.json();

				expect(response.status).toBe(500);
				expect(data.error).toBe("Internal server error");
			});
		});

		describe("Other client errors (4xx)", () => {
			it("should return appropriate status for other 4xx errors", async () => {
				const mockError = {
					statusCode: 400,
					message: "Bad request",
				};

				(streamText as any).mockImplementation(() => {
					throw mockError;
				});
				(APICallError.isInstance as any).mockReturnValue(true);

				const request = new NextRequest("http://localhost/api/llm", {
					method: "POST",
					body: JSON.stringify({
						provider: "anthropic",
						model: "claude-3-sonnet",
						messages: [{ role: "user", content: "test" }],
						apiKey: "test-key",
					}),
				});

				const response = await POST(request);
				const data = await response.json();

				expect(response.status).toBe(400);
				expect(data.error).toContain("API error");
			});
		});
	});

	describe("createProvider function", () => {
		it("should throw error for missing Anthropic API key", () => {
			expect(() => {
				createProvider("anthropic", {});
			}).toThrow("API key is required for Anthropic provider");
		});

		it("should throw error for missing OpenAI API key", () => {
			expect(() => {
				createProvider("openai", {});
			}).toThrow("API key is required for OpenAI provider");
		});

		it("should throw error for missing Google API key", () => {
			expect(() => {
				createProvider("google", {});
			}).toThrow("API key is required for Google provider");
		});

		it("should throw error for missing Bedrock credentials", () => {
			expect(() => {
				createProvider("bedrock", {
					awsAccessKeyId: "test-key",
					// Missing secretAccessKey and region
				});
			}).toThrow("AWS credentials");
		});

		it("should throw error for unsupported provider", () => {
			expect(() => {
				createProvider("invalid" as any, { apiKey: "test" });
			}).toThrow("Unsupported provider");
		});
	});
});
