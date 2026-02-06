"use client";

import {
	MessagePrimitive,
	useMessage,
} from "@assistant-ui/react";
import { MarkdownText, defaultComponents as markdownComponents } from "@/components/assistant-ui/markdown-text";
import Markdown from "react-markdown";
import { extractTextAfterYaml } from "@/lib/yaml-extractor";
import { useValidationResult } from "./ValidationContext";
import { StreamingIndicator } from "./StreamingIndicator";
import { ValidationFeedback } from "./ValidationFeedback";

export function ChatMessage() {
	const message = useMessage();
	const validation = useValidationResult(message.id);

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

	let displayContent: string;
	let showStreamingIndicator = false;
	let streamingLabel = '';

	if (isAssistant && isStreaming && !messageContent.trim()) {
		// Streaming just started, no content yet — show immediate indicator
		displayContent = '';
		showStreamingIndicator = true;
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
							hasYamlCodeBlock ? (
								// YAML block detected: render displayContent (YAML stripped) through markdown
								displayContent ? (
									<div className="flex-1 prose-sm">
										<Markdown components={markdownComponents}>{displayContent}</Markdown>
									</div>
								) : null
							) : (
								// No YAML block: use MessagePrimitive.Parts with MarkdownText for native streaming support
								<div className="flex-1">
									<MessagePrimitive.Parts components={{ Text: MarkdownText }} />
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
				</div>
			</MessagePrimitive.Root>

			<ValidationFeedback
				errors={validation?.validationErrors}
				warnings={validation?.validationWarnings}
			/>
		</>
	);
}
