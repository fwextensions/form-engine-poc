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
import type { PendingPdfContext } from "@/lib/pdf-extraction";

/**
 * Creates the chat transport for JSONL patch mode.
 *
 * Instead of sending the current YAML and expecting YAML back, this
 * transport sends the current schema as JSON and expects JSONL patches.
 */
export function createJsonlChatTransport(
	generator: JsonlSchemaGenerator,
	getCurrentSchema: () => SchemaComponent | null,
	getPendingPdfContext?: () => PendingPdfContext | null,
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
			// Consume pending PDF context before transforming messages
			const pdfContext = getPendingPdfContext?.() ?? null;

			const transformedMessages = messages.map((msg, index) => {
				// Only transform the last user message
				if (msg.role === "user" && index === messages.length - 1) {
					const currentSchema = getCurrentSchema();
					const hasSchema = currentSchema !== null;

					let originalText =
						msg.parts
							?.filter((part: any) => part.type === "text")
							.map((part: any) => part.text)
							.join("") || "";

					// Prepend PDF extraction context if available
					if (pdfContext?.type === "extraction") {
						const extractionJson = JSON.stringify(pdfContext.result, null, 2);
						originalText =
							`I have a PDF form ("${pdfContext.filename}") whose fields have been extracted. ` +
							`Here is the extracted structure:\n\n\`\`\`json\n${extractionJson}\n\`\`\`\n\n` +
							(originalText || "Please recreate this form based on the extracted fields.");
					}

					let fullPrompt: string;

					if (hasSchema) {
						const schemaJson = JSON.stringify(currentSchema, null, 2);
						fullPrompt = generator.buildEditPrompt(
							schemaJson,
							originalText,
						);
					} else {
						fullPrompt = generator.buildCreatePrompt(originalText);
					}

					// Preserve non-text parts (e.g. image attachments)
					const nonTextParts =
						msg.parts?.filter((part: any) => part.type !== "text") || [];

					// If attaching PDF directly, add as file part
					if (pdfContext?.type === "attachment") {
						nonTextParts.push({
							type: "file",
							url: pdfContext.dataUrl,
							mediaType: "application/pdf",
							filename: pdfContext.filename,
						} as any);
					}

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
