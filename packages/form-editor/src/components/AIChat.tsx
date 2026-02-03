"use client";

import React, { useState, useRef, useEffect } from "react";
import {
	MainContainer,
	ChatContainer,
	MessageList,
	Message,
	MessageInput,
	TypingIndicator,
} from "@chatscope/chat-ui-kit-react";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import { hasApiKey, getSettings } from "@/lib/settings";
import { SchemaGenerator } from "@/lib/schema-generator";
import { createAnthropicClient } from "@/lib/llm-client";
import { extractYamlFromResponse, extractTextAfterYaml } from "@/lib/yaml-extractor";
import { validateSchema } from "@/lib/schema-validator";

interface AIChatProps {
	currentSchema: string;
	onSchemaGenerated: (schema: string) => void;
	onOpenSettings: () => void;
}

interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
	timestamp: Date;
	extractedSchema?: string;
	validationErrors?: string[];
	validationWarnings?: string[];
}

/**
 * AI Chat interface component for schema generation.
 * 
 * Uses chatscope components for the chat UI and integrates with
 * SchemaGenerator for LLM interactions.
 * 
 * Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 7.8, 8.1, 8.2, 8.3, 8.4, 8.5
 */
export default function AIChat({
	currentSchema,
	onSchemaGenerated,
	onOpenSettings,
}: AIChatProps) {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [isGenerating, setIsGenerating] = useState(false);
	const [inputValue, setInputValue] = useState("");
	const generatorRef = useRef<SchemaGenerator | null>(null);
	const lastApiKeyRef = useRef<string | undefined>(undefined);

	// Initialize/reinitialize schema generator when API key changes
	// This ensures the generator is recreated when settings are updated
	const initializeGenerator = () => {
		if (hasApiKey()) {
			const settings = getSettings();
			// Recreate generator if API key has changed
			if (settings.apiKey && settings.apiKey !== lastApiKeyRef.current) {
				const client = createAnthropicClient({
					apiKey: settings.apiKey,
					model: settings.model,
				});
				generatorRef.current = new SchemaGenerator(client);
				lastApiKeyRef.current = settings.apiKey;
			}
		} else {
			// Clear generator if no API key
			generatorRef.current = null;
			lastApiKeyRef.current = undefined;
		}
	};

	// Check and initialize on every render (lightweight check)
	initializeGenerator();

	// Example prompts for empty state
	const examplePrompts = [
		"Create a contact form with name, email, and message fields",
		"Build a multi-step registration form with personal info and preferences",
		"Design a survey form with rating scales and text feedback",
	];

	const handleSendMessage = async (message: string) => {
		if (!message.trim() || isGenerating) {
			return;
		}

		// Check if API key is configured
		if (!hasApiKey()) {
			return;
		}

		const userMessage: ChatMessage = {
			id: `user-${Date.now()}`,
			role: "user",
			content: message,
			timestamp: new Date(),
		};

		setMessages((prev) => [...prev, userMessage]);
		setInputValue("");
		setIsGenerating(true);

		try {
			// Create assistant message that will be updated with streaming content
			const assistantMessageId = `assistant-${Date.now()}`;
			let assistantContent = "";

			setMessages((prev) => [
				...prev,
				{
					id: assistantMessageId,
					role: "assistant",
					content: "",
					timestamp: new Date(),
				},
			]);

			// Stream response from LLM
			const generator = generatorRef.current;
			if (!generator) {
				throw new Error("Schema generator not initialized");
			}

			// Determine if this is a new schema or an edit
			const isEdit = currentSchema.trim().length > 0;
			const stream = isEdit
				? generator.edit(currentSchema, message)
				: generator.generate(message);

			// Process streaming chunks
			for await (const chunk of stream) {
				assistantContent += chunk;

				// Update the assistant message with accumulated content
				setMessages((prev) =>
					prev.map((msg) =>
						msg.id === assistantMessageId
							? { ...msg, content: assistantContent }
							: msg
					)
				);
			}

			// After streaming completes, extract and validate YAML
			const extractedYaml = extractYamlFromResponse(assistantContent);

			if (extractedYaml) {
				// Validate the extracted schema
				const validationResult = validateSchema(extractedYaml);

				// Extract any text after the YAML block (LLM's summary/explanation)
				const textAfterYaml = extractTextAfterYaml(assistantContent);
				const displayMessage = textAfterYaml || "Form updated";

				// Update message with validation results and simplified content
				setMessages((prev) =>
					prev.map((msg) =>
						msg.id === assistantMessageId
							? {
									...msg,
									// Show LLM's summary or default message instead of full YAML
									content: displayMessage,
									extractedSchema: extractedYaml,
									validationErrors: validationResult.errors,
									validationWarnings: validationResult.warnings,
							  }
							: msg
					)
				);

				// If valid, update the schema
				if (validationResult.valid) {
					onSchemaGenerated(extractedYaml);
				}
			}
		} catch (error) {
			// Handle errors by adding an error message
			const errorMessage: ChatMessage = {
				id: `error-${Date.now()}`,
				role: "assistant",
				content: `Error: ${error instanceof Error ? error.message : "An unexpected error occurred"}`,
				timestamp: new Date(),
			};

			setMessages((prev) => [...prev, errorMessage]);
		} finally {
			setIsGenerating(false);
		}
	};

	const handleExampleClick = (prompt: string) => {
		setInputValue(prompt);
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
							disabled={isGenerating}
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
								isGenerating ? (
									<TypingIndicator content="AI is generating..." />
								) : null
							}
						>
							{messages.map((msg) => (
								<React.Fragment key={msg.id}>
									<Message
										model={{
											message: msg.content,
											sentTime: msg.timestamp.toISOString(),
											sender: msg.role === "user" ? "You" : "AI Assistant",
											direction:
												msg.role === "user" ? "outgoing" : "incoming",
											position: "single",
										}}
									/>

									{/* Validation errors */}
									{msg.validationErrors &&
										msg.validationErrors.length > 0 && (
											<div className="mx-4 my-2 p-3 bg-red-50 border border-red-200 rounded-lg">
												<p className="text-sm font-medium text-red-800 mb-2">
													Validation Errors:
												</p>
												<ul className="text-sm text-red-700 space-y-1">
													{msg.validationErrors.map((error, idx) => (
														<li key={idx}>• {error}</li>
													))}
												</ul>
											</div>
										)}

									{/* Validation warnings */}
									{msg.validationWarnings &&
										msg.validationWarnings.length > 0 && (
											<div className="mx-4 my-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
												<p className="text-sm font-medium text-yellow-800 mb-2">
													Warnings:
												</p>
												<ul className="text-sm text-yellow-700 space-y-1">
													{msg.validationWarnings.map((warning, idx) => (
														<li key={idx}>• {warning}</li>
													))}
												</ul>
											</div>
										)}

									{/* Success indicator */}
									{msg.extractedSchema &&
										(!msg.validationErrors ||
											msg.validationErrors.length === 0) && (
											<div className="mx-4 my-2 p-3 bg-green-50 border border-green-200 rounded-lg">
												<p className="text-sm text-green-800">
													✓ Schema generated successfully and applied to
													the editor
												</p>
											</div>
										)}
								</React.Fragment>
							))}
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
					disabled={isGenerating}
					attachButton={false}
					sendButton={true}
				/>
			</div>
		</div>
	);
}
