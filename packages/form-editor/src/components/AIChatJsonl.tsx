"use client";

import React, { useState, useRef, useCallback } from "react";
import {
	AssistantRuntimeProvider,
	ThreadPrimitive,
	useThread,
	useAssistantApi,
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
import { createJsonlChatTransport } from "@/lib/jsonl/chat-transport";
import {
	ValidationResultsContext,
	type ValidationResults,
} from "./chat/ValidationContext";
import { ChatMessage } from "./chat/ChatMessage";
import { ChatComposer } from "./chat/ChatComposer";
import { EmptyState } from "./chat/EmptyState";

interface AIChatJsonlProps {
	currentSchema: SchemaComponent | null;
	onSchemaChange: (schema: SchemaComponent, patches: PatchOp[], userMessage: string) => void;
	onOpenSettings: () => void;
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
	const api = useAssistantApi();

	const [isClient, setIsClient] = useState(false);
	const [hasKey, setHasKey] = useState(false);

	React.useEffect(() => {
		setIsClient(true);

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
		api.thread().append({
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
						<ThreadPrimitive.Messages
							components={{
								UserMessage: ChatMessage,
								AssistantMessage: ChatMessage,
							}}
						/>
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
 * Instead of extracting YAML from the LLM response, this component:
 * 1. Sends the current schema as JSON to the LLM
 * 2. Receives JSONL patch operations in the response
 * 3. Applies patches to produce the new schema
 * 4. Reports the patches and new schema to the parent for history tracking
 */
export default function AIChatJsonl(props: AIChatJsonlProps) {
	const currentSchemaRef = useRef<SchemaComponent | null>(props.currentSchema);
	const [validationResults, setValidationResults] = useState<ValidationResults>(
		new Map(),
	);

	// Track the user message for each assistant response
	const lastUserMessageRef = useRef<string>("");

	React.useEffect(() => {
		currentSchemaRef.current = props.currentSchema;
	}, [props.currentSchema]);

	// Initialize JSONL schema generator
	const generatorRef = useRef<JsonlSchemaGenerator | null>(null);
	if (generatorRef.current === null) {
		generatorRef.current = new JsonlSchemaGenerator();
	}

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
				const currentSchema = currentSchemaRef.current;

				if (currentSchema) {
					// Apply patches to current schema
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

						props.onSchemaChange(
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
					// No current schema — check for a replace op
					const replaceOp = schemaPatches.find((p) => p.op === "replace");

					if (replaceOp && replaceOp.op === "replace") {
						setValidationResults((prev) => {
							const newMap = new Map(prev);
							newMap.set(message.id, { schemaApplied: true });
							return newMap;
						});

						props.onSchemaChange(
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
				// Only errors, no valid patches
				setValidationResults((prev) => {
					const newMap = new Map(prev);
					newMap.set(message.id, {
						schemaApplied: false,
						validationErrors: errors,
					});
					return newMap;
				});
			}
			// If only message ops and no errors, no validation result needed
		},
		[props.onSchemaChange],
	);

	const runtime = useChatRuntime({
		transport: React.useMemo(
			() => createJsonlChatTransport(generatorRef, currentSchemaRef),
			[],
		),
		onFinish: handleFinish,
		onError: (error) => {
			console.error("[AIChatJsonl] onError:", error);
		},
	});

	// Capture user messages for history descriptions
	React.useEffect(() => {
		const unsubscribe = runtime.thread.subscribe(() => {
			const messages = runtime.thread.getState().messages;
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
		});

		return unsubscribe;
	}, [runtime]);

	return (
		<AssistantRuntimeProvider runtime={runtime}>
			<ValidationResultsContext.Provider value={validationResults}>
				<AIChatJsonlInner onOpenSettings={props.onOpenSettings} />
			</ValidationResultsContext.Provider>
		</AssistantRuntimeProvider>
	);
}
