"use client";

import React, { useState, useRef, useCallback, useSyncExternalStore } from "react";
import {
	AssistantRuntimeProvider,
	ThreadPrimitive,
	useThread,
	useAssistantRuntime,
} from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import {
	hasApiKey,
	getSettings,
	fetchServerCredentialStatus,
	saveSettings,
} from "@/lib/settings";
import {
	JsonlSchemaGenerator,
	createPatchStreamCompiler,
	applyPatches,
	type SchemaComponent,
	type PatchOp,
} from "@/lib/jsonl";
import type { UIMessage } from "ai";
import { createJsonlChatTransport } from "@/lib/jsonl/chat-transport";
import { saveChatMessages } from "@/lib/chat-storage";
import {
	ValidationResultsContext,
	type ValidationResults,
} from "./chat/ValidationContext";
import { ChatMessage } from "./chat/ChatMessage";
import { ChatComposer } from "./chat/ChatComposer";
import { EmptyState } from "./chat/EmptyState";

const subscribeToClientSnapshot = () => () => {};

interface AIChatJsonlProps {
	/** Which form this chat belongs to — used for localStorage persistence */
	formId: string;
	currentSchema: SchemaComponent | null;
	onSchemaChange: (schema: SchemaComponent, patches: PatchOp[], userMessage: string) => void;
	onOpenSettings: () => void;
	/** Pre-loaded messages from localStorage (loaded by parent before mount) */
	initialMessages?: UIMessage[];
}

/**
 * Inner component that has access to assistant-ui hooks.
 */
function AIChatJsonlInner({
	onOpenSettings,
}: {
	onOpenSettings: () => void;
}) {
	const thread = useThread();
	const runtime = useAssistantRuntime();

	const isClient = useSyncExternalStore(
		subscribeToClientSnapshot,
		() => true,
		() => false,
	);
	const [hasKey, setHasKey] = useState(false);

	React.useEffect(() => {
		fetchServerCredentialStatus().then((status) => {
			if (status.bedrockConfigured) {
				const settings = getSettings();
				const currentlyHasKey = hasApiKey();

				if (!currentlyHasKey) {
					saveSettings({ ...settings, provider: "bedrock" });
				}
			}
			setHasKey(hasApiKey());
		});
	}, []);

	const handleExampleClick = (prompt: string) => {
		if (!hasKey) return;
		runtime.thread.append({
			role: "user",
			content: [{ type: "text", text: prompt }],
		});
	};

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

	return (
		<div className="flex flex-col h-full bg-white">
			<div className="flex-1 overflow-hidden">
				<ThreadPrimitive.Root className="h-full">
					<ThreadPrimitive.Viewport className="h-full overflow-y-auto p-4">
						<ThreadPrimitive.Messages>
							{({ message }) => {
								if (message.role === "user") return <ChatMessage />;
								return <ChatMessage />;
							}}
						</ThreadPrimitive.Messages>
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
 * AI Chat component for JSONL patch-based schema editing.
 *
 * Each form gets its own conversation, persisted to localStorage.
 * The parent component passes `formId` and uses it as a React `key`
 * so the component remounts when the form changes, loading the
 * saved conversation for the new form.
 */
export default function AIChatJsonl(props: AIChatJsonlProps) {
	const {
		formId,
		currentSchema,
		onSchemaChange,
		onOpenSettings,
		initialMessages,
	} = props;
	const [validationResults, setValidationResults] = useState<ValidationResults>(
		new Map(),
	);

	const lastUserMessageRef = useRef<string>("");

	// Initialize JSONL schema generator
	const generator = React.useMemo(() => new JsonlSchemaGenerator(), []);
	const transport = React.useMemo(
		() => createJsonlChatTransport(generator, () => currentSchema),
		[generator, currentSchema],
	);

	// Process JSONL response on completion
	const handleFinish = useCallback(
		({ message }: { message: any }) => {
			if (message.role !== "assistant") return;

			const messageContent =
				message.parts
					?.filter(
						(part: any): part is { type: "text"; text: string } =>
							part.type === "text",
					)
					.map((part: any) => part.text)
					.join("") || "";

			// Parse JSONL lines from the response
			const compiler = createPatchStreamCompiler();
			const { patches: parseResults } = compiler.push(messageContent);
			const finalResults = compiler.flush();
			const allResults = [...parseResults, ...finalResults];

			// Extract successfully parsed patches
			const patches: PatchOp[] = [];
			const messages: string[] = [];
			const errors: string[] = [];

			for (const result of allResults) {
				if (result.patch) {
					patches.push(result.patch);
					if (result.patch.op === "message") {
						messages.push(result.patch.text);
					}
				} else if (result.error) {
					errors.push(`${result.error}: ${result.rawLine}`);
				}
			}

			// Separate schema-modifying patches from messages
			const schemaPatches = patches.filter((p) => p.op !== "message");

			if (schemaPatches.length > 0) {
				if (currentSchema) {
					const result = applyPatches(currentSchema, schemaPatches);

					if (result.successCount > 0) {
						setValidationResults((prev) => {
							const newMap = new Map(prev);
							newMap.set(message.id, {
								schemaApplied: true,
								validationErrors:
									result.failureCount > 0
										? result.results
												.filter((r) => !r.success)
												.map((r) => r.error || "Unknown error")
										: undefined,
							});
							return newMap;
						});

						onSchemaChange(
							result.schema,
							patches,
							lastUserMessageRef.current,
						);
					} else {
						setValidationResults((prev) => {
							const newMap = new Map(prev);
							newMap.set(message.id, {
								schemaApplied: false,
								validationErrors: result.results
									.filter((r) => !r.success)
									.map((r) => r.error || "Unknown error"),
							});
							return newMap;
						});
					}
				} else {
					const replaceOp = schemaPatches.find((p) => p.op === "replace");

					if (replaceOp && replaceOp.op === "replace") {
						setValidationResults((prev) => {
							const newMap = new Map(prev);
							newMap.set(message.id, { schemaApplied: true });
							return newMap;
						});

						onSchemaChange(
							replaceOp.schema,
							patches,
							lastUserMessageRef.current,
						);
					} else {
						setValidationResults((prev) => {
							const newMap = new Map(prev);
							newMap.set(message.id, {
								schemaApplied: false,
								validationErrors: [
									"No existing schema and no replace operation found",
								],
							});
							return newMap;
						});
					}
				}
			} else if (errors.length > 0) {
				setValidationResults((prev) => {
					const newMap = new Map(prev);
					newMap.set(message.id, {
						schemaApplied: false,
						validationErrors: errors,
					});
					return newMap;
				});
			}
		},
		[onSchemaChange, currentSchema],
	);

	const runtime = useChatRuntime({
		id: formId,
		messages: initialMessages,
		transport,
		onFinish: handleFinish,
		onError: (error) => {
			console.error("[AIChatJsonl] onError:", error);
		},
	});

	// Capture user messages for history descriptions + persist to localStorage
	React.useEffect(() => {
		const unsubscribe = runtime.thread.subscribe(() => {
			const state = runtime.thread.getState();
			const messages = state.messages;

			// Capture last user message for history descriptions
			const lastMsg = messages[messages.length - 1];
			if (lastMsg?.role === "user") {
				const text =
					lastMsg.content
						.filter(
							(part): part is { type: "text"; text: string } =>
								part.type === "text",
						)
						.map((part) => part.text)
						.join("") || "";
				lastUserMessageRef.current = text;
			}

			// Persist messages to localStorage whenever they change
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
				<AIChatJsonlInner onOpenSettings={onOpenSettings} />
			</ValidationResultsContext.Provider>
		</AssistantRuntimeProvider>
	);
}
