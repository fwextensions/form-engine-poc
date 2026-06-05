"use client";

import React, { useState, useRef, useCallback, useSyncExternalStore } from "react";
import {
	AssistantRuntimeProvider,
	ThreadPrimitive,
	useThread,
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
	type ValidationResult,
	type ValidationResults,
} from "./chat/ValidationContext";
import { FieldHighlightContext, type FieldHighlightFn } from "./chat/FieldHighlightContext";
import { ChatMessage } from "./chat/ChatMessage";
import { ChatComposer } from "./chat/ChatComposer";
import { EmptyState } from "./chat/EmptyState";
import { PdfDropZone, type PdfFile } from "./chat/PdfDropZone";
import type { PdfExtractionResult, PendingPdfContext } from "@/lib/pdf-extraction";

const subscribeToClientSnapshot = () => () => {};

interface AIChatJsonlProps {
	/** Which form this chat belongs to — used for localStorage persistence */
	formId: string;
	currentSchema: SchemaComponent | null;
	onSchemaChange: (schema: SchemaComponent, patches: PatchOp[], userMessage: string) => void;
	onOpenSettings: () => void;
	/** Pre-loaded messages from localStorage (loaded by parent before mount) */
	initialMessages?: UIMessage[];
	/** Callback to highlight a field in the form preview */
	onFieldHighlight?: FieldHighlightFn;
}

/**
 * Inner component that has access to assistant-ui hooks.
 */
function AIChatJsonlInner({
	onOpenSettings,
	pendingPdf,
	onClearPendingPdf,
	onPdfExtracted,
	onPdfAttachDirectly,
}: {
	onOpenSettings: () => void;
	pendingPdf: PendingPdfContext | null;
	onClearPendingPdf: () => void;
	onPdfExtracted: (result: PdfExtractionResult, filename: string) => void;
	onPdfAttachDirectly: (pdf: PdfFile) => void;
}) {
	const thread = useThread();

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

	const isEmpty = thread.messages.length === 0;

	return (
		<PdfDropZone
			onExtracted={onPdfExtracted}
			onAttachDirectly={onPdfAttachDirectly}
			disabled={thread.isRunning}
		>
			<ThreadPrimitive.Root className="flex-1 overflow-hidden relative">
				{isEmpty ? (
					<EmptyState
						isClient={isClient}
						hasKey={hasKey}
						onOpenSettings={onOpenSettings}
					/>
				) : (
					<>
						<ThreadPrimitive.Viewport className="h-full overflow-y-auto px-8 py-4">
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
				<div className="border-t border-slate-200">
					{pendingPdf && (
						<PendingPdfBanner context={pendingPdf} onClear={onClearPendingPdf} />
					)}
					<div className="p-4">
						<ChatComposer
							placeholder={
								pendingPdf
									? "Add instructions for the form, or just hit Send..."
									: isEmpty
										? "Describe your form..."
										: "Ask me to modify the form..."
							}
						/>
					</div>
				</div>
			)}
		</PdfDropZone>
	);
}

function PendingPdfBanner({
	context,
	onClear,
}: {
	context: PendingPdfContext;
	onClear: () => void;
}) {
	const label =
		context.type === "extraction"
			? `Extracted ${context.result.sections.reduce((n, s) => n + s.fields.length, 0)} fields from "${context.filename}"`
			: `PDF "${context.filename}" will be attached`;

	return (
		<div className="mx-4 mt-3 flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-sm text-blue-800">
			<svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
			</svg>
			<span className="flex-1 truncate">{label}</span>
			<button
				onClick={onClear}
				className="text-blue-500 hover:text-blue-700 flex-shrink-0"
			>
				<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
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
function AIChatJsonl(props: AIChatJsonlProps) {
	const {
		formId,
		currentSchema,
		onSchemaChange,
		onOpenSettings,
		initialMessages,
		onFieldHighlight,
	} = props;
	const [validationResults, setValidationResults] = useState<ValidationResults>(
		new Map(),
	);

	const lastUserMessageRef = useRef<string>("");

	// Pending PDF context: stored in a ref for the transport to consume, mirrored to state for UI
	const pendingPdfRef = useRef<PendingPdfContext | null>(null);
	const [pendingPdfDisplay, setPendingPdfDisplay] = useState<PendingPdfContext | null>(null);

	const setPendingPdf = useCallback((ctx: PendingPdfContext | null) => {
		pendingPdfRef.current = ctx;
		setPendingPdfDisplay(ctx);
	}, []);

	const handlePdfExtracted = useCallback((result: PdfExtractionResult, filename: string) => {
		setPendingPdf({ type: "extraction", result, filename });
	}, [setPendingPdf]);

	const handlePdfAttachDirectly = useCallback((pdf: PdfFile) => {
		setPendingPdf({ type: "attachment", dataUrl: pdf.dataUrl, filename: pdf.file.name });
	}, [setPendingPdf]);

	const consumePendingPdfRef = useRef(() => {
		const ctx = pendingPdfRef.current;
		if (ctx) {
			pendingPdfRef.current = null;
			queueMicrotask(() => setPendingPdfDisplay(null));
		}
		return ctx;
	});

	// Initialize JSONL schema generator
	const generator = React.useMemo(() => new JsonlSchemaGenerator(), []);
	const transport = React.useMemo(
		// eslint-disable-next-line react-hooks/refs -- closure is called at send time, not during render
		() => createJsonlChatTransport(generator, () => currentSchema, () => consumePendingPdfRef.current()),
		[generator, currentSchema],
	);

	// Restore patch cards for messages reloaded from localStorage.
	// handleFinish only runs for new LLM responses, so historical JSONL
	// messages need their cards reconstructed from stored text on mount.
	React.useEffect(() => {
		if (!initialMessages || initialMessages.length === 0) return;

		const restoredResults = new Map<string, ValidationResult>();

		for (const msg of initialMessages) {
			if (msg.role !== "assistant") continue;

			const text = (msg as any).parts
				?.filter((p: any) => p.type === "text")
				.map((p: any) => p.text)
				.join("") ?? "";

			if (!text) continue;

			const compiler = createPatchStreamCompiler();
			const { patches: parseResults } = compiler.push(text);
			const finalResults = compiler.flush();

			const patches: PatchOp[] = [...parseResults, ...finalResults]
				.filter((r) => r.patch)
				.map((r) => r.patch!);

			if (patches.length > 0) {
				// No success/error status for historical messages — apply already happened
				restoredResults.set(msg.id, {
					patchCards: patches.map((patch) => ({ patch })),
				});
			}
		}

		if (restoredResults.size > 0) {
			setValidationResults(restoredResults);
		}
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

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

			const allPatches: PatchOp[] = [];
			const parseErrors: string[] = [];

			for (const result of allResults) {
				if (result.patch) {
					allPatches.push(result.patch);
				} else if (result.error) {
					parseErrors.push(`${result.error}: ${result.rawLine}`);
				}
			}

			// Plain text message with no JSONL → nothing to do
			if (allPatches.length === 0 && parseErrors.length === 0) return;

			const schemaPatches = allPatches.filter((p) => p.op !== "message");

			// Apply schema patches and collect per-patch results
			type ApplyResult = { success: boolean; error?: string; removedNear?: { id: string; position: "before" | "after" } };
			let applyResults: ApplyResult[] = [];
			let schemaApplied = false;

			if (schemaPatches.length > 0) {
				if (currentSchema) {
					const batchResult = applyPatches(currentSchema, schemaPatches);
					applyResults = batchResult.results;
					if (batchResult.successCount > 0) {
						schemaApplied = true;
						onSchemaChange(batchResult.schema, allPatches, lastUserMessageRef.current);
					}
				} else {
					const replaceOp = schemaPatches.find((p) => p.op === "replace");
					if (replaceOp && replaceOp.op === "replace") {
						schemaApplied = true;
						applyResults = schemaPatches.map((p) => ({
							success: p.op === "replace",
							error: p.op !== "replace" ? "No existing schema" : undefined,
						}));
						onSchemaChange(replaceOp.schema, allPatches, lastUserMessageRef.current);
					} else {
						applyResults = schemaPatches.map(() => ({
							success: false,
							error: "No existing schema and no replace operation found",
						}));
					}
				}
			}

			// Build patch cards: pair each patch (including message ops) with its apply result
			let schemaPatchIdx = 0;
			const patchCards = allPatches.map((patch) => {
				if (patch.op === "message") return { patch, success: true as const };
				const result = applyResults[schemaPatchIdx++];
				return {
					patch,
					success: result?.success ?? false,
					error: result?.error,
					nearFieldId: result?.removedNear?.id,
					nearFieldPosition: result?.removedNear?.position,
				};
			});

			setValidationResults((prev) => {
				const newMap = new Map(prev);
				newMap.set(message.id, {
					schemaApplied,
					// Only show parse errors in ValidationFeedback; apply errors show inline in cards
					validationErrors: parseErrors.length > 0 ? parseErrors : undefined,
					patchCards: patchCards.length > 0 ? patchCards : undefined,
				});
				return newMap;
			});
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
				<FieldHighlightContext.Provider value={onFieldHighlight ?? null}>
					<AIChatJsonlInner
						onOpenSettings={onOpenSettings}
						pendingPdf={pendingPdfDisplay}
						onClearPendingPdf={() => setPendingPdf(null)}
						onPdfExtracted={handlePdfExtracted}
						onPdfAttachDirectly={handlePdfAttachDirectly}
					/>
				</FieldHighlightContext.Provider>
			</ValidationResultsContext.Provider>
		</AssistantRuntimeProvider>
	);
}

export default React.memo(AIChatJsonl);
