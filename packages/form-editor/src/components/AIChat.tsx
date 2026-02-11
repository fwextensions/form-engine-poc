"use client";

import React, { useState, useRef } from "react";
import {
	AssistantRuntimeProvider,
	ThreadPrimitive,
	useThread,
	useAssistantApi,
} from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { hasApiKey, getSettings, fetchServerCredentialStatus, saveSettings } from "@/lib/settings";
import { SchemaGenerator } from "@/lib/schema-generator";
import { extractYamlFromResponse } from "@/lib/yaml-extractor";
import { validateSchema } from "@/lib/schema-validator";
import type { UIMessage } from "ai";
import { createChatTransport } from "@/lib/chat-transport";
import { saveChatMessages } from "@/lib/chat-storage";
import { ValidationResultsContext, type ValidationResults } from "./chat/ValidationContext";
import { ChatMessage } from "./chat/ChatMessage";
import { ChatComposer } from "./chat/ChatComposer";
import { EmptyState } from "./chat/EmptyState";

interface AIChatProps {
	/** Which form this chat belongs to — used for localStorage persistence */
	formId: string;
	currentSchema: string;
	onSchemaGenerated: (schema: string) => void;
	onOpenSettings: () => void;
	/** Pre-loaded messages from localStorage (loaded by parent before mount) */
	initialMessages?: UIMessage[];
}

/**
 * Inner component that has access to assistant-ui hooks.
 * Handles credential checking, empty state routing, and chat layout.
 */
function AIChatInner({
	onOpenSettings,
}: {
	onOpenSettings: () => void;
}) {
	const thread = useThread();
	const api = useAssistantApi();

	// Defer API key check until after hydration to avoid SSR mismatch
	const [isClient, setIsClient] = useState(false);
	const [hasKey, setHasKey] = useState(false);

	React.useEffect(() => {
		setIsClient(true);

		// Fetch server credential status on mount
		fetchServerCredentialStatus().then((status) => {
			if (status.bedrockConfigured) {
				const settings = getSettings();
				const currentlyHasKey = hasApiKey();

				// If no client-side credentials exist for any provider, auto-select bedrock
				if (!currentlyHasKey) {
					saveSettings({ ...settings, provider: "bedrock" });
				}
			}
			// Re-check hasApiKey after server status is cached
			setHasKey(hasApiKey());
		});
	}, []);

	const handleExampleClick = (prompt: string) => {
		if (!hasKey) return;
		api.thread().append({
			role: "user",
			content: [{ type: "text", text: prompt }],
		});
	};

	// Render empty state when no messages
	if (thread.messages.length === 0) {
		return (
			<EmptyState
				isClient={isClient}
				hasKey={hasKey}
				onOpenSettings={onOpenSettings}
				onExampleClick={handleExampleClick}
			/>
		);
	}

	// Render chat interface with messages
	return (
		<div className="flex flex-col h-full bg-white">
			<div className="flex-1 overflow-hidden">
				<ThreadPrimitive.Root className="h-full">
					<ThreadPrimitive.Viewport className="h-full overflow-y-auto p-4">
						<ThreadPrimitive.Messages components={{ UserMessage: ChatMessage, AssistantMessage: ChatMessage }} />
					</ThreadPrimitive.Viewport>
					<ThreadPrimitive.ScrollToBottom className="absolute bottom-4 right-4" />
				</ThreadPrimitive.Root>
			</div>
			<div className="border-t border-slate-200 p-4">
				<ChatComposer placeholder="Ask me to modify the form..." />
			</div>
		</div>
	);
}

/**
 * AI Chat interface component for schema generation.
 *
 * Sets up the chat runtime with custom transport, validates extracted
 * YAML schemas on completion, and provides validation results to
 * child components via context.
 */
export default function AIChat(props: AIChatProps) {
	const currentSchemaRef = useRef<string>(props.currentSchema);
	const [validationResults, setValidationResults] = useState<ValidationResults>(new Map());

	// Keep currentSchemaRef in sync with props
	React.useEffect(() => {
		currentSchemaRef.current = props.currentSchema;
	}, [props.currentSchema]);

	// Initialize schema generator
	const generatorRef = useRef<SchemaGenerator | null>(null);
	if (generatorRef.current === null) {
		generatorRef.current = new SchemaGenerator();
	}

	// Configure useChatRuntime with custom transport and onFinish callback
	const runtime = useChatRuntime({
		id: props.formId,
		messages: props.initialMessages,
		transport: React.useMemo(
			() => createChatTransport(generatorRef, currentSchemaRef),
			[],
		),
		onFinish: ({ message }) => {
			if (message.role === 'assistant') {
				const messageContent = message.parts
					?.filter((part): part is { type: 'text'; text: string } => part.type === 'text')
					.map(part => part.text)
					.join('') || '';

				const extractedYaml = extractYamlFromResponse(messageContent);

				if (extractedYaml) {
					const validationResult = validateSchema(extractedYaml);
					const isValid = validationResult.valid;

					setValidationResults(prev => {
						const newMap = new Map(prev);
						newMap.set(message.id, {
							extractedSchema: extractedYaml,
							validationErrors: validationResult.errors,
							validationWarnings: validationResult.warnings,
							schemaApplied: isValid,
						});
						return newMap;
					});

					if (isValid) {
						props.onSchemaGenerated(extractedYaml);
					}
				}
			}
		},
		onError: (error) => {
			console.error('[AIChat] onError:', error);
		},
	});

	// Persist messages to localStorage whenever they change
	React.useEffect(() => {
		const unsubscribe = runtime.thread.subscribe(() => {
			const messages = runtime.thread.getState().messages;
			if (messages.length > 0) {
				saveChatMessages(
					props.formId,
					messages.map((msg) => ({
						id: msg.id,
						role: msg.role,
						parts: msg.content
							.filter(
								(part): part is { type: "text"; text: string } =>
									part.type === "text",
							)
							.map((part) => ({ type: "text" as const, text: part.text })),
					})),
				);
			}
		});
		return unsubscribe;
	}, [runtime, props.formId]);

	return (
		<AssistantRuntimeProvider runtime={runtime}>
			<ValidationResultsContext.Provider value={validationResults}>
				<AIChatInner onOpenSettings={props.onOpenSettings} />
			</ValidationResultsContext.Provider>
		</AssistantRuntimeProvider>
	);
}
