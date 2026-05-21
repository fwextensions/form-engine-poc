/**
 * JSONL Chat Transport
 *
 * Custom transport for the AI assistant that sends the current schema
 * as JSON and instructs the LLM to return JSONL patches.
 */

import { AssistantChatTransport } from "@assistant-ui/react-ai-sdk";
import type { UIMessage } from "ai";
import { getSettings, getModelForProvider, getServerCredentialStatus } from "@/lib/settings";
import type { JsonlSchemaGenerator } from "./schema-generator";
import type { SchemaComponent } from "./types";

/**
 * Creates the chat transport for JSONL patch mode.
 *
 * Instead of sending the current YAML and expecting YAML back, this
 * transport sends the current schema as JSON and expects JSONL patches.
 */
export function createJsonlChatTransport(
	generator: JsonlSchemaGenerator,
	getCurrentSchema: () => SchemaComponent | null,
): AssistantChatTransport<UIMessage> {
	return new AssistantChatTransport({
		api: "/api/llm",
		body: () => {
			const settings = getSettings();

			const requestBody: Record<string, any> = {
				provider: settings.provider,
				model: getModelForProvider(settings),
				system: generator.getSystemPrompt(),
			};

			// Add provider-specific credentials (same as existing transport)
			if (settings.provider === "bedrock") {
				const serverStatus = getServerCredentialStatus();
				if (serverStatus?.bedrockConfigured) {
					// Server has credentials; skip client credentials
				} else {
					const authMethod = settings.bedrockAuthMethod || "iam";
					requestBody.bedrockAuthMethod = authMethod;
					requestBody.awsRegion = settings.awsRegion;

					if (authMethod === "apiKey") {
						requestBody.bedrockApiKey = settings.bedrockApiKey;
					} else {
						requestBody.awsAccessKeyId = settings.awsAccessKeyId;
						requestBody.awsSecretAccessKey = settings.awsSecretAccessKey;
					}
				}
			} else {
				requestBody.apiKey = settings.apiKey;
			}

			return requestBody;
		},
		prepareSendMessagesRequest: ({ messages, body }) => {
			const transformedMessages = messages.map((msg, index) => {
				// Only transform the last user message
				if (msg.role === "user" && index === messages.length - 1) {
					const currentSchema = getCurrentSchema();
					const hasSchema = currentSchema !== null;

					const originalText =
						msg.parts
							?.filter((part: any) => part.type === "text")
							.map((part: any) => part.text)
							.join("") || "";

					let fullPrompt: string;

					if (hasSchema) {
						// Edit mode: include current schema as JSON
						const schemaJson = JSON.stringify(currentSchema, null, 2);
						fullPrompt = generator.buildEditPrompt(
							schemaJson,
							originalText,
						);
					} else {
						// Create mode: no existing schema
						fullPrompt = generator.buildCreatePrompt(originalText);
					}

					// Preserve non-text parts (e.g. image attachments)
					const nonTextParts =
						msg.parts?.filter((part: any) => part.type !== "text") || [];

					return {
						...msg,
						parts: [
							{ type: "text" as const, text: fullPrompt },
							...nonTextParts,
						],
					};
				}
				return msg;
			});

			return {
				body: {
					...body,
					messages: transformedMessages,
				},
			};
		},
	});
}
