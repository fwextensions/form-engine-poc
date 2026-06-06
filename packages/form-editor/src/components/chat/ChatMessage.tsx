"use client";

import {
	MessagePrimitive,
	useMessage,
} from "@assistant-ui/react";
import { Streamdown } from "streamdown";
import { MarkdownText } from "@/components/assistant-ui/markdown-text";
import { extractTextAfterYaml } from "@/lib/yaml-extractor";
import { looksLikeJsonl, extractJsonlDisplay } from "@/lib/jsonl-display";
import { useValidationResult } from "./ValidationContext";
import { usePdfExtraction } from "./PdfExtractionContext";
import { StreamingIndicator } from "./StreamingIndicator";
import { ValidationFeedback } from "./ValidationFeedback";
import { PatchCards } from "./PatchCards";
import { PdfExtractionCard } from "./PdfExtractionCard";

export function ChatMessage() {
	const message = useMessage();
	const validation = useValidationResult(message.id);
	const pdfExtraction = usePdfExtraction(message.id);

	// Extract text content from message parts
	const messageContent = message.content
		.filter((part): part is { type: 'text'; text: string } => part.type === 'text')
		.map(part => part.text)
		.join('');

	// Extract image parts from user messages (from attachments)
	const imageParts = message.role === 'user'
		? message.content.filter((part: any) =>
			(part.type === 'image') ||
			(part.type === 'file' && typeof part.mimeType === 'string' && part.mimeType.startsWith('image/'))
		)
		: [];

	const isAssistant = message.role === 'assistant';
	const isStreaming = isAssistant &&
		'status' in message &&
		typeof message.status === 'object' &&
		message.status !== null &&
		'type' in message.status &&
		message.status.type === 'running';

	// Detect YAML code blocks specifically (```yaml or ```yml)
	const yamlCodeBlockMatch = messageContent.match(/```ya?ml/i);
	const hasYamlCodeBlock = isAssistant && yamlCodeBlockMatch !== null;

	// Detect JSONL patch content
	const hasJsonl = isAssistant && looksLikeJsonl(messageContent);

	let displayContent: string;
	let showStreamingIndicator = false;
	let streamingLabel = '';

	if (isAssistant && isStreaming && !messageContent.trim()) {
		// Streaming just started, no content yet — show immediate indicator
		displayContent = '';
		showStreamingIndicator = true;
	} else if (hasJsonl) {
		// JSONL patch mode: extract message op texts, hide raw JSON
		const jsonlResult = extractJsonlDisplay(messageContent);

		if (isStreaming) {
			displayContent = jsonlResult.displayText;
			showStreamingIndicator = true;
			streamingLabel = 'Updating schema…';
		} else {
			displayContent = jsonlResult.displayText || 'Form updated';
		}
	} else if (hasYamlCodeBlock) {
		const codeBlockStartIndex = messageContent.indexOf('```');
		const textBefore = messageContent.substring(0, codeBlockStartIndex).trim();
		const textAfter = extractTextAfterYaml(messageContent);

		if (isStreaming) {
			// While streaming: hide the code block, show indicator
			const parts = [textBefore, textAfter].filter(Boolean);
			displayContent = parts.join('\n\n');
			showStreamingIndicator = true;
			streamingLabel = 'Generating schema…';
		} else {
			// Complete: hide the code block, show text around it
			const parts = [textBefore, textAfter].filter(Boolean);
			displayContent = parts.join('\n\n') || 'Form updated';
		}
	} else {
		displayContent = messageContent;
	}

	// Check if schema was successfully applied (for showing checkmark)
	const schemaApplied = validation?.schemaApplied === true;

	// Completed JSONL message: render patch cards instead of raw text
	if (isAssistant && !isStreaming && validation?.patchCards) {
		return (
			<>
				<MessagePrimitive.Root className="flex justify-start mb-4">
					<div className="max-w-[94%] text-ink-800">
						{schemaApplied && (
							<p className="text-xs font-medium text-success-700 mb-2">Schema updated</p>
						)}
						<PatchCards cards={validation.patchCards} />
					</div>
				</MessagePrimitive.Root>
				<ValidationFeedback
					errors={validation?.validationErrors}
					warnings={validation?.validationWarnings}
				/>
			</>
		);
	}

	// For JSONL and YAML block content, use static markdown rendering
	// (since we've transformed the content, we can't use native streaming parts)
	const useStaticMarkdown = hasJsonl || hasYamlCodeBlock;

	return (
		<>
			<MessagePrimitive.Root
				className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} mb-4`}
			>
				<div
					className={`max-w-[80%] rounded-lg ${
						message.role === "user"
							? "bg-ink-50 text-ink-800 px-4 py-2"
							: "text-ink-800 py-1"
					}`}
				>
					{/* Render attached images for user messages */}
					{imageParts.length > 0 && (
						<div className="flex flex-wrap gap-2 mb-2">
							{imageParts.map((part: any, i: number) => {
								const src = part.type === 'image' ? part.image : part.data;
								return (
									<img
										key={i}
										src={src}
										alt="Attached image"
										className="max-h-32 rounded border border-blue-400/30"
									/>
								);
							})}
						</div>
					)}
					<div className="flex items-start gap-2">
						{isAssistant ? (
							// Assistant messages: render with markdown
							useStaticMarkdown ? (
								// YAML or JSONL detected: render transformed text as markdown
								displayContent ? (
									<div className="flex-1 text-sm">
										<Streamdown mode={isStreaming ? "streaming" : "static"} isAnimating={isStreaming}>
											{displayContent}
										</Streamdown>
									</div>
								) : null
							) : (
								// Plain text: use MessagePrimitive.Parts with MarkdownText for native streaming support
								<div className="flex-1">
									<MessagePrimitive.Parts>
										{({ part }) => {
											if (part.type === "text") return <MarkdownText />;
											return null;
										}}
									</MessagePrimitive.Parts>
								</div>
							)
						) : (
							// User messages: plain text rendering
							displayContent ? (
								<div className="whitespace-pre-wrap flex-1">
									{displayContent}
								</div>
							) : null
						)}
						{schemaApplied && (
							<span className="text-green-600 flex-shrink-0" title="Schema applied">✅</span>
						)}
					</div>
					{showStreamingIndicator && (
						<StreamingIndicator label={streamingLabel} hasContent={!!displayContent} />
					)}
					{pdfExtraction && (
						<PdfExtractionCard
							result={pdfExtraction.result}
							filename={pdfExtraction.filename}
						/>
					)}
				</div>
			</MessagePrimitive.Root>

			<ValidationFeedback
				errors={validation?.validationErrors}
				warnings={validation?.validationWarnings}
			/>
		</>
	);
}
