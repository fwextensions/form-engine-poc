import { AssistantChatTransport } from "@assistant-ui/react-ai-sdk";
import type { UIMessage } from "ai";
import { getSettings, getModelForProvider, getServerCredentialStatus } from "@/lib/settings";
import type { SchemaGenerator } from "@/lib/schema-generator";
import type { PendingPdfContext } from "@/lib/pdf-extraction";

/**
 * Creates the chat transport for the AI assistant.
 *
 * Handles provider-specific credential injection and message transformation
 * for edit mode (prepending current schema context to user messages).
 */
export function createChatTransport(
	generator: SchemaGenerator,
	getCurrentSchema: () => string,
	getPendingPdfContext?: () => PendingPdfContext | null,
): AssistantChatTransport<UIMessage> {
	return new AssistantChatTransport({
		api: "/api/llm",
		body: () => {
			const settings = getSettings();

			// Build request body with only relevant credentials for the provider
			const requestBody: Record<string, any> = {
				provider: settings.provider,
				model: getModelForProvider(settings),
				system: generator.getSystemPrompt(),
			};

			// Add provider-specific credentials
			if (settings.provider === "bedrock") {
				// Check if server-side Bedrock credentials are configured
				const serverStatus = getServerCredentialStatus();
				if (serverStatus?.bedrockConfigured) {
					// Server has credentials configured; skip sending client Bedrock credentials
				} else {
					// No server credentials; send client-supplied Bedrock credentials
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
				// Other providers use API key
				requestBody.apiKey = settings.apiKey;
			}

			return requestBody;
		},
		prepareSendMessagesRequest: ({ messages, body }) => {
			const pdfContext = getPendingPdfContext?.() ?? null;

			const transformedMessages = messages.map((msg, index) => {
				if (msg.role === "user" && index === messages.length - 1) {
					const currentSchema = getCurrentSchema();
					const isEdit = currentSchema.trim().length > 0;

					let originalText = msg.parts
						?.filter((part: any) => part.type === "text")
						.map((part: any) => part.text)
						.join("") || "";

					if (pdfContext?.type === "extraction") {
						const extractionJson = JSON.stringify(pdfContext.result, null, 2);
						originalText =
							`I have a PDF form ("${pdfContext.filename}") whose fields have been extracted. ` +
							`Here is the extracted structure:\n\n\`\`\`json\n${extractionJson}\n\`\`\`\n\n` +
							(originalText || "Please recreate this form based on the extracted fields.");
					}

					const nonTextParts = msg.parts?.filter((part: any) => part.type !== "text") || [];

					if (pdfContext?.type === "attachment") {
						nonTextParts.push({
							type: "file",
							url: pdfContext.dataUrl,
							mediaType: "application/pdf",
							filename: pdfContext.filename,
						} as any);
					}

					if (isEdit) {
						const fullPrompt = generator.buildEditPrompt(currentSchema, originalText);
						return {
							...msg,
							parts: [{ type: "text" as const, text: fullPrompt }, ...nonTextParts],
						};
					}

					if (pdfContext) {
						return {
							...msg,
							parts: [{ type: "text" as const, text: originalText }, ...nonTextParts],
						};
					}
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
