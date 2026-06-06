"use client";

import React, { useState, useRef, useCallback, useSyncExternalStore } from "react";
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
import { PdfExtractionContext, type PdfExtractionMap } from "./chat/PdfExtractionContext";
import { ChatMessage } from "./chat/ChatMessage";
import { ChatComposer } from "./chat/ChatComposer";
import { EmptyState } from "./chat/EmptyState";
import { PdfDropZone, type PdfFile } from "./chat/PdfDropZone";
import type { PdfExtractionResult, PendingPdfContext } from "@/lib/pdf-extraction";

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
	const [pdfExtractionMap, setPdfExtractionMap] = useState<PdfExtractionMap>(new Map());

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
			if (ctx.type === "extraction") {
				pendingExtractionAssocRef.current = { result: ctx.result, filename: ctx.filename };
			}
			queueMicrotask(() => setPendingPdfDisplay(null));
		}
		return ctx;
	});

	const pendingExtractionAssocRef = useRef<{ result: PdfExtractionResult; filename: string } | null>(null);

	// Initialize schema generator
	const generator = React.useMemo(() => new SchemaGenerator(), []);
	const transport = React.useMemo(
		// eslint-disable-next-line react-hooks/refs -- closure is called at send time, not during render
		() => createChatTransport(generator, () => currentSchema, () => consumePendingPdfRef.current()),
		[generator, currentSchema],
	);

	// Configure useChatRuntime with custom transport and onFinish callback
	const runtime = useChatRuntime({
		id: formId,
		messages: initialMessages,
		transport,
		onFinish: ({ message }) => {
			if (message.role === "assistant") {
				// Associate pending PDF extraction with the user message that triggered this response
				const extraction = pendingExtractionAssocRef.current;
				if (extraction) {
					pendingExtractionAssocRef.current = null;
					const messages = runtimeRef.current.thread.getState().messages;
					const assistantIdx = messages.findIndex((m: any) => m.id === message.id);
					const userMsg = assistantIdx > 0
						? messages.slice(0, assistantIdx).reverse().find((m: any) => m.role === "user")
						: messages.slice().reverse().find((m: any) => m.role === "user");
					if (userMsg) {
						setPdfExtractionMap((prev) => {
							const next = new Map(prev);
							next.set(userMsg.id, extraction);
							return next;
						});
					}
				}

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

	const runtimeRef = useRef(runtime);
	runtimeRef.current = runtime;

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
				<PdfExtractionContext.Provider value={pdfExtractionMap}>
					<AIChatInner
						onOpenSettings={onOpenSettings}
						pendingPdf={pendingPdfDisplay}
						onClearPendingPdf={() => setPendingPdf(null)}
						onPdfExtracted={handlePdfExtracted}
						onPdfAttachDirectly={handlePdfAttachDirectly}
					/>
				</PdfExtractionContext.Provider>
			</ValidationResultsContext.Provider>
		</AssistantRuntimeProvider>
	);
}
