"use client";

import React, { useState, useRef } from "react";
import {
	AssistantRuntimeProvider,
	ThreadPrimitive,
	ComposerPrimitive,
	MessagePrimitive,
	useMessage,
	useAssistantEvent,
	useAssistantRuntime,
	useThread,
} from "@assistant-ui/react";
import { useChatRuntime, AssistantChatTransport } from "@assistant-ui/react-ai-sdk";
import { hasApiKey, getSettings, getModelForProvider } from "@/lib/settings";
import { SchemaGenerator } from "@/lib/schema-generator";
import { extractYamlFromResponse, extractTextAfterYaml } from "@/lib/yaml-extractor";
import { validateSchema } from "@/lib/schema-validator";

interface AIChatProps {
	currentSchema: string;
	onSchemaGenerated: (schema: string) => void;
	onOpenSettings: () => void;
}

// Type for validation results
type ValidationResults = Map<string, {
	extractedSchema?: string;
	validationErrors?: string[];
	validationWarnings?: string[];
}>;

/**
 * Inner component that has access to assistant-ui hooks
 */
function AIChatInner({
	currentSchema,
	onSchemaGenerated,
	onOpenSettings,
	generatorRef,
	validationResults,
	setValidationResults,
}: AIChatProps & {
	generatorRef: React.MutableRefObject<SchemaGenerator | null>;
	validationResults: ValidationResults;
	setValidationResults: React.Dispatch<React.SetStateAction<ValidationResults>>;
}) {
	// Access runtime via hooks
	const runtime = useAssistantRuntime();
	const thread = useThread();

	// Example prompts for empty state
	const examplePrompts = [
		"Create a contact form with name, email, and message fields",
		"Build a multi-step registration form with personal info and preferences",
		"Design a survey form with rating scales and text feedback",
	];

	const handleExampleClick = (prompt: string) => {
		if (!hasApiKey()) return;
		handleSendMessage(prompt);
	};

	const handleSendMessage = async (message: string) => {
		if (!message.trim()) return;
		if (!hasApiKey()) return;

		// Determine if this is a new schema or an edit
		const isEdit = currentSchema.trim().length > 0;
		const fullPrompt = isEdit
			? generatorRef.current!.buildEditPrompt(currentSchema, message)
			: message;

		// Send message via runtime API
		// Note: We store fullPrompt in a custom property that prepareSendMessagesRequest will use
		runtime.thread.append({
			role: "user",
			content: [{ type: "text", text: message }],
		} as any);
	};

	// Helper to get validation results for a message
	const getValidationForMessage = (messageId: string) => {
		return validationResults.get(messageId);
	};

	// Check if currently loading
	const isRunning = thread.isRunning;

	// Custom message component that displays validation results
	const CustomMessage = () => {
		const message = useMessage();
		const validation = getValidationForMessage(message.id);

		// Extract text content from message parts
		const messageContent = message.content
			.filter((part): part is { type: 'text'; text: string } => part.type === 'text')
			.map(part => part.text)
			.join('');

		const displayContent = validation?.extractedSchema
			? extractTextAfterYaml(messageContent) || "Form updated"
			: messageContent;

		return (
			<>
				<MessagePrimitive.Root
					className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} mb-4`}
				>
					<div
						className={`max-w-[80%] rounded-lg px-4 py-2 ${
							message.role === "user"
								? "bg-blue-500 text-white"
								: "bg-slate-100 text-slate-900"
						}`}
					>
						<div className="whitespace-pre-wrap">
							{displayContent}
						</div>
					</div>
				</MessagePrimitive.Root>

				{/* Validation errors */}
				{validation?.validationErrors &&
					validation.validationErrors.length > 0 && (
						<div className="mx-4 my-2 p-3 bg-red-50 border border-red-200 rounded-lg">
							<p className="text-sm font-medium text-red-800 mb-2">
								Validation Errors:
							</p>
							<ul className="text-sm text-red-700 space-y-1">
								{validation.validationErrors.map((error, idx) => (
									<li key={idx}>• {error}</li>
								))}
							</ul>
						</div>
					)}

				{/* Validation warnings */}
				{validation?.validationWarnings &&
					validation.validationWarnings.length > 0 && (
						<div className="mx-4 my-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
							<p className="text-sm font-medium text-yellow-800 mb-2">
								Warnings:
							</p>
							<ul className="text-sm text-yellow-700 space-y-1">
								{validation.validationWarnings.map((warning, idx) => (
									<li key={idx}>• {warning}</li>
								))}
							</ul>
						</div>
					)}

				{/* Success indicator */}
				{validation?.extractedSchema &&
					(!validation.validationErrors ||
						validation.validationErrors.length === 0) && (
						<div className="mx-4 my-2 p-3 bg-green-50 border border-green-200 rounded-lg">
							<p className="text-sm text-green-800">
								✓ Schema generated successfully and applied to
								the editor
							</p>
						</div>
					)}
			</>
		);
	};

	// Render empty state when no messages
	const messages = thread.messages;
	if (messages.length === 0) {
		return (
			<div className="flex flex-col h-full bg-white">
				{/* Header */}
				<div className="border-b border-slate-200 p-4">
					<h2 className="text-lg font-semibold text-slate-800">
						AI Assistant
					</h2>
					<p className="text-sm text-slate-600 mt-1">
						Describe your form in natural language and I'll generate the
						schema for you.
					</p>
				</div>

				{/* Empty state content */}
				<div className="flex-1 flex flex-col items-center justify-center p-8">
					{!hasApiKey() ? (
						// API key not configured
						<div className="text-center max-w-md">
							<div className="mb-4">
								<svg
									className="w-16 h-16 mx-auto text-slate-300"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
									/>
								</svg>
							</div>
							<h3 className="text-xl font-semibold text-slate-800 mb-2">
								API Key Required
							</h3>
							<p className="text-slate-600 mb-6">
								To use the AI assistant, you need to configure your LLM
								API key in settings.
							</p>
							<button
								onClick={onOpenSettings}
								className="bg-blue-500 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded transition-colors"
							>
								Open Settings
							</button>
						</div>
					) : (
						// API key configured - show example prompts
						<div className="text-center max-w-2xl">
							<div className="mb-6">
								<svg
									className="w-16 h-16 mx-auto text-blue-500"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
									/>
								</svg>
							</div>
							<h3 className="text-xl font-semibold text-slate-800 mb-2">
								Start a Conversation
							</h3>
							<p className="text-slate-600 mb-6">
								Describe the form you want to create, and I'll generate
								the YAML schema for you.
							</p>

							{/* Schema context indicator */}
							{currentSchema.trim().length > 0 && (
								<div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
									<p className="text-sm text-blue-800">
										<span className="font-medium">Note:</span> I can see
										your current schema and help you modify it.
									</p>
								</div>
							)}

							{/* Example prompts */}
							<div className="space-y-3">
								<p className="text-sm font-medium text-slate-700 mb-3">
									Try these examples:
								</p>
								{examplePrompts.map((prompt, index) => (
									<button
										key={index}
										onClick={() => handleExampleClick(prompt)}
										className="w-full text-left p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
									>
										<p className="text-sm text-slate-700">{prompt}</p>
									</button>
								))}
							</div>
						</div>
					)}
				</div>

				{/* Message input */}
				{hasApiKey() && (
					<div className="border-t border-slate-200 p-4">
						<ComposerPrimitive.Root
							onSubmit={(e) => {
								e.preventDefault();
								const input = e.currentTarget.querySelector('input');
								if (input && input.value.trim()) {
									handleSendMessage(input.value);
									input.value = '';
								}
							}}
							className="flex gap-2"
						>
							<ComposerPrimitive.Input
								placeholder="Describe your form..."
								disabled={isRunning}
								className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
							<ComposerPrimitive.Send
								disabled={isRunning}
								className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
							>
								Send
							</ComposerPrimitive.Send>
						</ComposerPrimitive.Root>
					</div>
				)}
			</div>
		);
	}

	// Render chat interface with messages
	return (
		<div className="flex flex-col h-full bg-white">
			{/* Header */}
			<div className="border-b border-slate-200 p-4">
				<h2 className="text-lg font-semibold text-slate-800">
					AI Assistant
				</h2>
				{currentSchema.trim().length > 0 && (
					<p className="text-xs text-blue-600 mt-1">
						✓ I can see and modify your current schema
					</p>
				)}
			</div>

			{/* Chat messages */}
			<div className="flex-1 overflow-hidden">
				<ThreadPrimitive.Root className="h-full">
					<ThreadPrimitive.Viewport className="h-full overflow-y-auto p-4">
						<ThreadPrimitive.Messages components={{ UserMessage: CustomMessage, AssistantMessage: CustomMessage }} />
					</ThreadPrimitive.Viewport>
					<ThreadPrimitive.ScrollToBottom className="absolute bottom-4 right-4" />
				</ThreadPrimitive.Root>
			</div>

			{/* Message input */}
			<div className="border-t border-slate-200 p-4">
				<ComposerPrimitive.Root
					onSubmit={(e) => {
						e.preventDefault();
						const input = e.currentTarget.querySelector('input');
						if (input && input.value.trim()) {
							handleSendMessage(input.value);
							input.value = '';
						}
					}}
					className="flex gap-2"
				>
					<ComposerPrimitive.Input
						placeholder="Ask me to modify the form..."
						disabled={isRunning}
						className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
					<ComposerPrimitive.Send
						disabled={isRunning}
						className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
					>
						{isRunning ? "Generating..." : "Send"}
					</ComposerPrimitive.Send>
				</ComposerPrimitive.Root>
			</div>
		</div>
	);
}

/**
 * AI Chat interface component for schema generation.
 *
 * Uses assistant-ui components for the chat UI and integrates with
 * the Vercel AI SDK's useChatRuntime hook for LLM interactions.
 *
 * Requirements: 2.1, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 7.8, 8.1, 8.2, 8.3, 8.4, 8.5
 */
export default function AIChat(props: AIChatProps) {
	const generatorRef = useRef<SchemaGenerator | null>(null);
	const currentSchemaRef = useRef<string>(props.currentSchema);
	const [validationResults, setValidationResults] = useState<Map<string, {
		extractedSchema?: string;
		validationErrors?: string[];
		validationWarnings?: string[];
	}>>(new Map());

	// Keep currentSchemaRef in sync with props
	currentSchemaRef.current = props.currentSchema;

	// Initialize schema generator
	if (!generatorRef.current) {
		generatorRef.current = new SchemaGenerator();
	}

	// Configure useChatRuntime with custom transport and onFinish callback
	const runtime = useChatRuntime({
		transport: new AssistantChatTransport({
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
					// Bedrock uses either AWS credentials or API key
					const authMethod = settings.bedrockAuthMethod || 'iam';
					requestBody.bedrockAuthMethod = authMethod;
					requestBody.awsRegion = settings.awsRegion;

					if (authMethod === 'apiKey') {
						requestBody.bedrockApiKey = settings.bedrockApiKey;
					} else {
						requestBody.awsAccessKeyId = settings.awsAccessKeyId;
						requestBody.awsSecretAccessKey = settings.awsSecretAccessKey;
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

							return {
								...msg,
								parts: [{ type: 'text' as const, text: fullPrompt }],
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
		}),
		onFinish: ({ message }) => {
			console.log('[AIChat] onFinish called', message);

			if (message.role === 'assistant') {
				// Extract text content from message parts
				const messageContent = message.parts
					?.filter((part): part is { type: 'text'; text: string } => part.type === 'text')
					.map(part => part.text)
					.join('') || '';

				console.log('[AIChat] messageContent:', messageContent);
				const extractedYaml = extractYamlFromResponse(messageContent);
				console.log('[AIChat] extractedYaml:', extractedYaml);

				if (extractedYaml) {
					// Validate the extracted schema
					const validationResult = validateSchema(extractedYaml);
					console.log('[AIChat] validationResult:', validationResult);

					// Store validation results for this message
					setValidationResults(prev => {
						const newMap = new Map(prev);
						newMap.set(message.id, {
							extractedSchema: extractedYaml,
							validationErrors: validationResult.errors,
							validationWarnings: validationResult.warnings,
						});
						return newMap;
					});

					// If valid, update the schema
					if (validationResult.valid) {
						console.log('[AIChat] Schema is valid, calling onSchemaGenerated');
						props.onSchemaGenerated(extractedYaml);
					} else {
						console.log('[AIChat] Schema is invalid, not updating');
					}
				} else {
					console.log('[AIChat] No YAML extracted from response');
				}
			}
		},
		onError: (error) => {
			console.error('[AIChat] onError:', error);
		},
	});

	return (
		<AssistantRuntimeProvider runtime={runtime}>
			<AIChatInner {...props} generatorRef={generatorRef} validationResults={validationResults} setValidationResults={setValidationResults} />
		</AssistantRuntimeProvider>
	);
}
