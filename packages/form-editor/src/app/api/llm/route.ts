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
	messages: Array<{
		role: string;
		content?: string;
		parts?: Array<{ type: string; text?: string; url?: string; mediaType?: string; filename?: string; mimeType?: string; data?: string }>;
	}>;
	system?: string;
	maxTokens?: number;
	// AWS Bedrock specific
	bedrockAuthMethod?: "iam" | "apiKey";
	awsAccessKeyId?: string;
	awsSecretAccessKey?: string;
	awsRegion?: string;
	bedrockApiKey?: string;
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
		bedrockAuthMethod?: "iam" | "apiKey";
		awsAccessKeyId?: string;
		awsSecretAccessKey?: string;
		awsRegion?: string;
		bedrockApiKey?: string;
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

		case "bedrock": {
			// Server-side credentials take precedence
			const serverApiKey = process.env.BEDROCK_API_KEY;
			const serverRegion = process.env.AWS_REGION;

			if (serverApiKey && serverRegion) {
				console.log('[LLM API] Using SERVER-SIDE Bedrock credentials');
				console.log('[LLM API] Region:', serverRegion);
				console.log('[LLM API] API Key (first 20 chars):', serverApiKey.substring(0, 20) + '...');
				return createAmazonBedrock({
					region: serverRegion,
					apiKey: serverApiKey,
				});
			}

			console.log('[LLM API] No server credentials found, using CLIENT-SUPPLIED credentials');
			// Fall back to client-supplied credentials (existing logic)
			const authMethod = credentials.bedrockAuthMethod || "iam";
			
			if (authMethod === "apiKey") {
				// API Key authentication using bearer token
				if (!credentials.bedrockApiKey || !credentials.awsRegion) {
					throw new Error(
						"Bedrock API key and region are required for API key authentication"
					);
				}
				
				return createAmazonBedrock({
					region: credentials.awsRegion,
					apiKey: credentials.bedrockApiKey,
				});
			} else {
				// IAM authentication using access keys
				if (
					!credentials.awsAccessKeyId ||
					!credentials.awsSecretAccessKey ||
					!credentials.awsRegion
				) {
					throw new Error(
						"AWS credentials (accessKeyId, secretAccessKey, region) are required for IAM authentication"
					);
				}
				return createAmazonBedrock({
					region: credentials.awsRegion,
					accessKeyId: credentials.awsAccessKeyId,
					secretAccessKey: credentials.awsSecretAccessKey,
				});
			}
		}

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
			bedrockAuthMethod,
			awsAccessKeyId,
			awsSecretAccessKey,
			awsRegion,
			bedrockApiKey,
		} = body;
		
		// Log minimal request info (avoid logging full schema/images)
		console.log(`[LLM API] ${provider}/${model} - ${messages.length} message(s)`);

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
			bedrockAuthMethod,
			awsAccessKeyId,
			awsSecretAccessKey,
			awsRegion,
			bedrockApiKey,
		});

		// Call streamText with the provider's model and messages
		// Transform UIMessage format, preserving multi-modal content (images)
		const transformedMessages = messages.map((msg) => {
			// Handle UIMessage format with parts array
			if ('parts' in msg && Array.isArray(msg.parts)) {
				// Check if message contains any file/image parts
				const hasFileParts = msg.parts.some(
					(part: any) => part.type === 'file' || part.type === 'image'
				);

				if (hasFileParts && msg.role === 'user') {
					// Build multi-modal content array for the AI SDK
					const content: Array<{ type: 'text'; text: string } | { type: 'image'; image: string }> = [];
					for (const part of msg.parts) {
						if (part.type === 'text') {
							content.push({ type: 'text', text: part.text || '' });
						} else if (part.type === 'file' && part.mediaType?.startsWith('image/')) {
							// File part with image media type (from vercelAttachmentAdapter)
							content.push({ type: 'image', image: part.url || '' });
						} else if (part.type === 'image') {
							content.push({ type: 'image', image: part.url || '' });
						}
					}

					return {
						role: 'user' as const,
						content,
					};
				}

				// Text-only message: flatten to string
				const textContent = msg.parts
					.filter((part: any) => part.type === 'text')
					.map((part: any) => part.text)
					.join('');
				return {
					role: msg.role as "user" | "assistant" | "system",
					content: textContent,
				};
			}
			// Handle simple {role, content} format
			return {
				role: msg.role as "user" | "assistant" | "system",
				content: msg.content || '',
			};
		});

		const result = streamText({
			model: providerInstance(model),
			messages: transformedMessages,
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
