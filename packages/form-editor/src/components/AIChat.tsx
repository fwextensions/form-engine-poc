"use client";

import React, { useState, useSyncExternalStore } from "react";
import {
	AssistantRuntimeProvider,
	ThreadPrimitive,
	useThread,
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

const subscribeToClientSnapshot = () => () => {};

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

	// Defer API key check until after hydration to avoid SSR mismatch
	const isClient = useSyncExternalStore(
		subscribeToClientSnapshot,
		() => true,
		() => false,
	);
	const [hasKey, setHasKey] = useState(false);

	React.useEffect(() => {
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

	const isEmpty = thread.messages.length === 0;

	return (
		<div className="flex flex-col h-full bg-white">
			<ThreadPrimitive.Root className="flex-1 overflow-hidden relative">
				{isEmpty ? (
					<EmptyState
						isClient={isClient}
						hasKey={hasKey}
						onOpenSettings={onOpenSettings}
					/>
				) : (
					<>
						<ThreadPrimitive.Viewport className="h-full overflow-y-auto p-4">
							<ThreadPrimitive.Messages>
								{({ message }) => {
									if (message.role === "user") return <ChatMessage />;
									return <ChatMessage />;
								}}
							</ThreadPrimitive.Messages>
						</ThreadPrimitive.Viewport>
						<ThreadPrimitive.ScrollToBottom className="absolute bottom-4 right-4" />
					</>
				)}
			</ThreadPrimitive.Root>
			{hasKey && (
				<div className="border-t border-slate-200 p-4">
					<ChatComposer
						placeholder={isEmpty ? "Describe your form..." : "Ask me to modify the form..."}
					/>
				</div>
			)}
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
	const {
		formId,
		currentSchema,
		onSchemaGenerated,
		onOpenSettings,
		initialMessages,
	} = props;
	const [validationResults, setValidationResults] = useState<ValidationResults>(new Map());

	// Initialize schema generator
	const generator = React.useMemo(() => new SchemaGenerator(), []);
	const transport = React.useMemo(
		() => createChatTransport(generator, () => currentSchema),
		[generator, currentSchema],
	);

	// Configure useChatRuntime with custom transport and onFinish callback
	const runtime = useChatRuntime({
		id: formId,
		messages: initialMessages,
		transport,
		onFinish: ({ message }) => {
			if (message.role === "assistant") {
				const messageContent = message.parts
					?.filter((part): part is { type: "text"; text: string } => part.type === "text")
					.map((part) => part.text)
					.join("") || "";

				const extractedYaml = extractYamlFromResponse(messageContent);

				if (extractedYaml) {
					const validationResult = validateSchema(extractedYaml);
					const isValid = validationResult.valid;

					setValidationResults((prev) => {
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
						onSchemaGenerated(extractedYaml);
					}
				}
			}
		},
		onError: (error) => {
			console.error("[AIChat] onError:", error);
		},
	});

	// Persist messages to localStorage whenever they change
	React.useEffect(() => {
		const unsubscribe = runtime.thread.subscribe(() => {
			const messages = runtime.thread.getState().messages;
			if (messages.length > 0) {
				saveChatMessages(
					formId,
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
	}, [runtime, formId]);

	return (
		<AssistantRuntimeProvider runtime={runtime}>
			<ValidationResultsContext.Provider value={validationResults}>
				<AIChatInner onOpenSettings={onOpenSettings} />
			</ValidationResultsContext.Provider>
		</AssistantRuntimeProvider>
	);
}
