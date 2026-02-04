import { NextRequest, NextResponse } from "next/server";
import { streamText, APICallError } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import type { LLMProvider } from "@/lib/settings";

/**
 * Request body structure for LLM API calls.
 */
interface LLMRequest {
	provider: LLMProvider;
	apiKey?: string;
	model: string;
	messages: Array<{ role: string; content: string }>;
	system?: string;
	maxTokens?: number;
	// AWS Bedrock specific
	awsAccessKeyId?: string;
	awsSecretAccessKey?: string;
	awsRegion?: string;
}

/**
 * Creates a provider instance based on the provider type and credentials.
 * 
 * @param provider - The LLM provider type (anthropic, openai, google, bedrock)
 * @param credentials - Provider-specific credentials
 * @returns A provider instance with a model method
 * @throws Error if required credentials are missing
 */
export function createProvider(
	provider: LLMProvider,
	credentials: {
		apiKey?: string;
		awsAccessKeyId?: string;
		awsSecretAccessKey?: string;
		awsRegion?: string;
	}
) {
	switch (provider) {
		case "anthropic":
			if (!credentials.apiKey) {
				throw new Error("API key is required for Anthropic provider");
			}
			return createAnthropic({
				apiKey: credentials.apiKey,
			});

		case "openai":
			if (!credentials.apiKey) {
				throw new Error("API key is required for OpenAI provider");
			}
			return createOpenAI({
				apiKey: credentials.apiKey,
			});

		case "google":
			if (!credentials.apiKey) {
				throw new Error("API key is required for Google provider");
			}
			return createGoogleGenerativeAI({
				apiKey: credentials.apiKey,
			});

		case "bedrock":
			if (
				!credentials.awsAccessKeyId ||
				!credentials.awsSecretAccessKey ||
				!credentials.awsRegion
			) {
				throw new Error(
					"AWS credentials (accessKeyId, secretAccessKey, region) are required for Bedrock provider"
				);
			}
			return createAmazonBedrock({
				region: credentials.awsRegion,
				accessKeyId: credentials.awsAccessKeyId,
				secretAccessKey: credentials.awsSecretAccessKey,
			});

		default:
			throw new Error(`Unsupported provider: ${provider}`);
	}
}

/**
 * API route to proxy LLM requests using Vercel AI SDK.
 * This endpoint accepts requests from the client and uses streamText to stream responses.
 */
export async function POST(request: NextRequest) {
	try {
		const body: LLMRequest = await request.json();
		const {
			provider,
			apiKey,
			model,
			messages,
			system,
			maxTokens,
			awsAccessKeyId,
			awsSecretAccessKey,
			awsRegion,
		} = body;

		// Validate required fields
		if (!provider) {
			return NextResponse.json(
				{ error: "Provider is required" },
				{ status: 400 }
			);
		}

		if (!model) {
			return NextResponse.json(
				{ error: "Model is required" },
				{ status: 400 }
			);
		}

		// Create provider instance using factory function
		const providerInstance = createProvider(provider, {
			apiKey,
			awsAccessKeyId,
			awsSecretAccessKey,
			awsRegion,
		});

		// Call streamText with the provider's model and messages
		const result = streamText({
			model: providerInstance(model),
			messages: messages.map((msg) => ({
				role: msg.role as "user" | "assistant" | "system",
				content: msg.content,
			})),
			...(system && { system }),
			...(maxTokens && { maxTokens }),
		});

		// Return streaming response compatible with useChat
		return result.toUIMessageStreamResponse();
	} catch (error) {
		console.error("LLM API error:", error);

		// Handle missing provider or credentials errors (from createProvider)
		if (error instanceof Error) {
			// Missing credentials errors should return 400
			if (
				error.message.includes("API key is required") ||
				error.message.includes("AWS credentials") ||
				error.message.includes("Unsupported provider")
			) {
				return NextResponse.json(
					{ error: error.message },
					{ status: 400 }
				);
			}
		}

		// Handle Vercel AI SDK API call errors
		if (APICallError.isInstance(error)) {
			const statusCode = error.statusCode;

			// Authentication errors (401, 403)
			if (statusCode === 401 || statusCode === 403) {
				return NextResponse.json(
					{ error: "Authentication failed: Please check your API key or credentials" },
					{ status: 401 }
				);
			}

			// Rate limit errors (429)
			if (statusCode === 429) {
				return NextResponse.json(
					{ error: "Rate limit exceeded: Please wait before retrying" },
					{ status: 429 }
				);
			}

			// Client errors (400-499, excluding 401, 403, 429)
			if (statusCode && statusCode >= 400 && statusCode < 500) {
				return NextResponse.json(
					{ error: `API error: ${error.message}` },
					{ status: statusCode }
				);
			}

			// Server errors (500+) or no status code
			return NextResponse.json(
				{ error: `Server error: ${error.message}` },
				{ status: statusCode || 500 }
			);
		}

		// Generic error response for unexpected errors
		if (error instanceof Error) {
			return NextResponse.json(
				{ error: error.message },
				{ status: 500 }
			);
		}

		// Fallback for non-Error objects
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
