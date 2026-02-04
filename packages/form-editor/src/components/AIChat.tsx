"use client";

import React, { useState, useRef } from "react";
import {
	MainContainer,
	ChatContainer,
	MessageList,
	Message,
	MessageInput,
	TypingIndicator,
} from "@chatscope/chat-ui-kit-react";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { hasApiKey, getSettings, getModelForProvider } from "@/lib/settings";
import { SchemaGenerator } from "@/lib/schema-generator";
import { extractYamlFromResponse, extractTextAfterYaml } from "@/lib/yaml-extractor";
import { validateSchema } from "@/lib/schema-validator";

interface AIChatProps {
	currentSchema: string;
	onSchemaGenerated: (schema: string) => void;
	onOpenSettings: () => void;
}

/**
 * AI Chat interface component for schema generation.
 * 
 * Uses chatscope components for the chat UI and integrates with
 * the Vercel AI SDK's useChat hook for LLM interactions.
 * 
 * Requirements: 2.1, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 7.8, 8.1, 8.2, 8.3, 8.4, 8.5
 */
export default function AIChat({
	currentSchema,
	onSchemaGenerated,
	onOpenSettings,
}: AIChatProps) {
	const [inputValue, setInputValue] = useState("");
	const generatorRef = useRef<SchemaGenerator | null>(null);
	const [validationResults, setValidationResults] = useState<Map<string, {
		extractedSchema?: string;
		validationErrors?: string[];
		validationWarnings?: string[];
	}>>(new Map());

	// Initialize schema generator
	if (!generatorRef.current) {
		generatorRef.current = new SchemaGenerator();
	}

	// Configure useChat hook with API endpoint and credentials
	// Use a function for body to ensure settings are always fresh
	const { messages, sendMessage, status, error } = useChat({
		transport: new DefaultChatTransport({
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
					// Bedrock uses AWS credentials
					requestBody.awsAccessKeyId = settings.awsAccessKeyId;
					requestBody.awsSecretAccessKey = settings.awsSecretAccessKey;
					requestBody.awsRegion = settings.awsRegion;
				} else {
					// Other providers use API key
					requestBody.apiKey = settings.apiKey;
				}

				return requestBody;
			},
			prepareSendMessagesRequest: ({ messages, body }) => {
				// Transform messages to use fullPrompt from metadata if available
				const transformedMessages = messages.map((msg) => {
					if (msg.role === 'user' && msg.metadata?.fullPrompt) {
						// Use the full prompt for the API call
						return {
							...msg,
							parts: [{ type: 'text' as const, text: msg.metadata.fullPrompt }],
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
		}),
		onFinish: (options) => {
			// Extract and validate YAML when streaming completes
			const message = options.message;
			const messageContent = message.parts.map(part => {
				if (part.type === 'text') {
					return part.text;
				}
				return '';
			}).join('');

			const extractedYaml = extractYamlFromResponse(messageContent);

			if (extractedYaml) {
				// Validate the extracted schema
				const validationResult = validateSchema(extractedYaml);

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
					onSchemaGenerated(extractedYaml);
				}
			}
		},
	});

	// Check if currently loading
	const isLoading = status === 'submitted' || status === 'streaming';

	// Example prompts for empty state
	const examplePrompts = [
		"Create a contact form with name, email, and message fields",
		"Build a multi-step registration form with personal info and preferences",
		"Design a survey form with rating scales and text feedback",
	];

	const handleSendMessage = async (message: string) => {
		if (!message.trim() || isLoading) {
			return;
		}

		// Check if API key is configured
		if (!hasApiKey()) {
			return;
		}

		// Determine if this is a new schema or an edit
		const isEdit = currentSchema.trim().length > 0;
		const fullPrompt = isEdit
			? generatorRef.current!.buildEditPrompt(currentSchema, message)
			: message;

		// Clear input and send message via useChat
		// Send the user's original message for display, but include the full prompt as metadata
		setInputValue("");
		await sendMessage({
			text: message, // Display the user's actual message
			metadata: {
				fullPrompt: fullPrompt, // Include the full prompt for the API
			},
		});
	};

	const handleExampleClick = (prompt: string) => {
		setInputValue(prompt);
	};

	// Helper to get validation results for a message
	const getValidationForMessage = (messageId: string) => {
		return validationResults.get(messageId);
	};

	// Render empty state when no messages
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
						<MessageInput
							placeholder="Describe your form..."
							value={inputValue}
							onChange={(val) => setInputValue(val)}
							onSend={handleSendMessage}
							disabled={isLoading}
							attachButton={false}
							sendButton={true}
						/>
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
				<MainContainer>
					<ChatContainer>
						<MessageList
							typingIndicator={
								isLoading ? (
									<TypingIndicator content="AI is generating..." />
								) : null
							}
						>
							{messages.map((msg) => {
								const validation = getValidationForMessage(msg.id);
								
								// Extract text content from message parts
								const messageContent = msg.parts.map(part => {
									if (part.type === 'text') {
										return part.text;
									}
									return '';
								}).join('');

								const displayContent = validation?.extractedSchema
									? extractTextAfterYaml(messageContent) || "Form updated"
									: messageContent;

								return (
									<React.Fragment key={msg.id}>
										<Message
											model={{
												message: displayContent,
												sentTime: new Date().toISOString(),
												sender: msg.role === "user" ? "You" : "AI Assistant",
												direction:
													msg.role === "user" ? "outgoing" : "incoming",
												position: "single",
											}}
										/>

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
									</React.Fragment>
								);
							})}

							{/* Error display */}
							{error && (
								<div className="mx-4 my-2 p-3 bg-red-50 border border-red-200 rounded-lg">
									<p className="text-sm font-medium text-red-800 mb-1">
										Error
									</p>
									<p className="text-sm text-red-700">
										{error.message || "An unexpected error occurred"}
									</p>
								</div>
							)}
						</MessageList>
					</ChatContainer>
				</MainContainer>
			</div>

			{/* Message input */}
			<div className="border-t border-slate-200 p-4">
				<MessageInput
					placeholder="Ask me to modify the form..."
					value={inputValue}
					onChange={(val) => setInputValue(val)}
					onSend={handleSendMessage}
					disabled={isLoading}
					attachButton={false}
					sendButton={true}
				/>
			</div>
		</div>
	);
}
