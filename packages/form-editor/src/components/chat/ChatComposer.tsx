"use client";

import { useState, useEffect } from "react";
import {
	ComposerPrimitive,
	AttachmentPrimitive,
	useThread,
	useThreadComposerAttachment,
} from "@assistant-ui/react";

/** Image thumbnail preview using data URL from the attachment File */
function ImageThumb() {
	const file = useThreadComposerAttachment((a) => a.file);
	const [src, setSrc] = useState<string | undefined>();
	useEffect(() => {
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => setSrc(reader.result as string);
		reader.readAsDataURL(file);
	}, [file]);
	if (!src) return null;
	return <img src={src} alt="preview" className="h-14 w-14 rounded border border-ink-200 object-cover" />;
}

/** Attachment thumbnail with remove button for display in the composer */
function ComposerAttachmentImage() {
	return (
		<AttachmentPrimitive.Root className="relative inline-block group">
			<ImageThumb />
			<AttachmentPrimitive.Remove className="absolute -top-1.5 -right-1.5 bg-ink-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
				&times;
			</AttachmentPrimitive.Remove>
		</AttachmentPrimitive.Root>
	);
}

/** Composer with attachment support (image paste/attach) */
export function ChatComposer({ placeholder }: { placeholder: string }) {
	const thread = useThread();
	const isRunning = thread.isRunning;

	return (
		<ComposerPrimitive.Root className="flex flex-col gap-2">
			<ComposerPrimitive.Attachments>
				{() => <ComposerAttachmentImage />}
			</ComposerPrimitive.Attachments>
			<div className="flex gap-2">
				<ComposerPrimitive.AddAttachment
					className="flex-shrink-0 p-2 text-ink-400 hover:text-ink-600 rounded-lg hover:bg-ink-100 transition-colors self-end"
				>
					<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
					</svg>
				</ComposerPrimitive.AddAttachment>
				<ComposerPrimitive.Input
					placeholder={placeholder}
					disabled={isRunning}
					autoFocus
					className="flex-1 px-4 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 resize-none min-h-[42px] max-h-32 overflow-y-auto"
					rows={1}
				/>
				<ComposerPrimitive.Send
					disabled={isRunning}
					className="px-6 py-2 bg-primary-600 text-white rounded-lg enabled:hover:bg-primary-700 disabled:bg-ink-100 disabled:text-ink-300 transition-colors"
				>
					{isRunning ? "Generating..." : "Send"}
				</ComposerPrimitive.Send>
			</div>
		</ComposerPrimitive.Root>
	);
}
