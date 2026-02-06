import { AssistantChatTransport } from "@assistant-ui/react-ai-sdk";
import type { UIMessage } from "ai";
import { getSettings, getModelForProvider, getServerCredentialStatus } from "@/lib/settings";
import type { SchemaGenerator } from "@/lib/schema-generator";

/**
 * Creates the chat transport for the AI assistant.
 *
 * Handles provider-specific credential injection and message transformation
 * for edit mode (prepending current schema context to user messages).
 */
export function createChatTransport(
	generatorRef: { current: SchemaGenerator | null },
	currentSchemaRef: { current: string },
): AssistantChatTransport<UIMessage> {
	return new AssistantChatTransport({
		api: '/api/llm',
		body: () => {
			const settings = getSettings();

			// Build request body with only relevant credentials for the provider
			const requestBody: Record<string, any> = {
				provider: settings.provider,
				model: getModelForProvider(settings),
				system: generatorRef.current!.getSystemPrompt(),
			};

			// Add provider-specific credentials
			if (settings.provider === 'bedrock') {
				// Check if server-side Bedrock credentials are configured
				const serverStatus = getServerCredentialStatus();
				if (serverStatus?.bedrockConfigured) {
					// Server has credentials configured; skip sending client Bedrock credentials
				} else {
					// No server credentials; send client-supplied Bedrock credentials
					const authMethod = settings.bedrockAuthMethod || 'iam';
					requestBody.bedrockAuthMethod = authMethod;
					requestBody.awsRegion = settings.awsRegion;

					if (authMethod === 'apiKey') {
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
			// Transform the last user message to include current schema context if editing
			const transformedMessages = messages.map((msg, index) => {
				// Only transform the last user message
				if (msg.role === 'user' && index === messages.length - 1) {
					const currentSchema = currentSchemaRef.current;
					const isEdit = currentSchema.trim().length > 0;

					if (isEdit) {
						// Get the original text from the message parts
						const originalText = msg.parts
							?.filter((part: any) => part.type === 'text')
							.map((part: any) => part.text)
							.join('') || '';

						// Build the full edit prompt
						const fullPrompt = generatorRef.current!.buildEditPrompt(currentSchema, originalText);

						// Preserve non-text parts (e.g. image attachments)
						const nonTextParts = msg.parts?.filter((part: any) => part.type !== 'text') || [];

						return {
							...msg,
							parts: [{ type: 'text' as const, text: fullPrompt }, ...nonTextParts],
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
