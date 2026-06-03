"use client";

import React, { useEffect, useRef } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import * as Toolbar from "@radix-ui/react-toolbar";
import ToolbarIconButton from "./ToolbarIconButton";
import { UndoIcon, RedoIcon } from "./icons";
import Editor from "@monaco-editor/react";
import AIChat from "./AIChat";
import AIChatJsonl from "./AIChatJsonl";
import type { SchemaComponent, PatchOp } from "@/lib/jsonl";
import type { UIMessage } from "ai";
import type { editor } from "monaco-editor";

interface EditorPaneProps {
	schema: string;
	onSchemaChange: (schema: string) => void;
	activeTab: "yaml" | "ai";
	onTabChange: (tab: "yaml" | "ai") => void;
	onOpenSettings: () => void;
	/** Current form name — used to key the chat component per form */
	formId: string;
	/** Pre-loaded messages for the current form */
	initialMessages: UIMessage[];
	/** JSONL mode props — when provided, uses patch-based AI editing */
	jsonlMode?: {
		currentSchema: SchemaComponent | null;
		onSchemaChange: (schema: SchemaComponent, patches: PatchOp[], userMessage: string) => void;
	};
	/** Callback to highlight a field in the form preview */
	onFieldHighlight?: (fieldId: string) => void;
	history?: {
		canUndo: boolean;
		canRedo: boolean;
		undoDescription?: string;
		redoDescription?: string;
		onUndo: () => void;
		onRedo: () => void;
	};
}

/**
 * EditorPane component with tabbed interface for YAML editing and AI assistance.
 *
 * Uses Radix UI Tabs to switch between:
 * - YAML Editor: Monaco editor for manual schema editing
 * - AI Assistant: Chat interface for LLM-assisted schema generation
 *
 * When `jsonlMode` props are provided, uses the JSONL patch-based AI chat
 * instead of the YAML-based one.
 *
 * The chat component is keyed by `formId` so it remounts when the user
 * switches forms, loading the saved conversation for each form.
 */
export default function EditorPane({
	schema,
	onSchemaChange,
	activeTab,
	onTabChange,
	onOpenSettings,
	formId,
	initialMessages,
	jsonlMode,
	history,
	onFieldHighlight,
}: EditorPaneProps) {
	const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
	const localSchemaEchoesRef = useRef<Set<string>>(new Set());
	const previousFormIdRef = useRef(formId);

	useEffect(() => {
		const editor = editorRef.current;
		const model = editor?.getModel();
		const hasChangedForm = previousFormIdRef.current !== formId;
		previousFormIdRef.current = formId;
		if (!editor || !model) return;

		if (hasChangedForm) {
			localSchemaEchoesRef.current.clear();
		}
		if (model.getValue() === schema) return;
		if (!hasChangedForm && localSchemaEchoesRef.current.delete(schema)) {
			return;
		}

		const selection = editor.getSelection();
		model.setValue(schema);
		if (selection) {
			editor.setSelection(selection);
		}
	}, [schema, formId]);

	return (
		<Tabs.Root
			value={activeTab}
			onValueChange={(value) => onTabChange(value as "yaml" | "ai")}
			className="flex flex-col h-full"
		>
			{/* Tab List */}
			<div className="flex items-center justify-between min-h-12 border-b border-slate-200 bg-slate-50">
				<Tabs.List className="flex">
					<Tabs.Trigger
						value="yaml"
						className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:bg-white"
					>
						YAML Editor
					</Tabs.Trigger>
					<Tabs.Trigger
						value="ai"
						className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:bg-white"
					>
						AI Assistant
					</Tabs.Trigger>
				</Tabs.List>
				{history && (
					<Toolbar.Root className="flex items-center gap-0 px-2" aria-label="Editor history actions">
						<ToolbarIconButton
							onClick={history.onUndo}
							disabled={!history.canUndo}
							title={history.undoDescription ? `Undo: ${history.undoDescription}` : "Undo"}
							aria-label="Undo"
						>
							<UndoIcon />
						</ToolbarIconButton>
						<ToolbarIconButton
							onClick={history.onRedo}
							disabled={!history.canRedo}
							title={history.redoDescription ? `Redo: ${history.redoDescription}` : "Redo"}
							aria-label="Redo"
						>
							<RedoIcon />
						</ToolbarIconButton>
					</Toolbar.Root>
				)}
			</div>

			{/* YAML Editor Tab Content */}
			<Tabs.Content value="yaml" className="flex-1 overflow-hidden">
				<Editor
					height="100%"
					language="yaml"
					defaultValue={schema}
					onMount={(editor) => {
						editorRef.current = editor;
					}}
					onChange={(value) => {
						const nextSchema = value || "";
						localSchemaEchoesRef.current.add(nextSchema);
						onSchemaChange(nextSchema);
					}}
					options={{
						minimap: { enabled: false },
						scrollBeyondLastLine: false,
						automaticLayout: true,
						wordWrap: "on",
					}}
				/>
			</Tabs.Content>

			{/* AI Assistant Tab Content - keep mounted to preserve conversation state */}
			<Tabs.Content
				value="ai"
				className="flex-1 overflow-hidden data-[state=inactive]:hidden"
				forceMount
			>
				{jsonlMode ? (
					<AIChatJsonl
						key={formId}
						formId={formId}
						initialMessages={initialMessages}
						currentSchema={jsonlMode.currentSchema}
						onSchemaChange={jsonlMode.onSchemaChange}
						onOpenSettings={onOpenSettings}
						onFieldHighlight={onFieldHighlight}
					/>
				) : (
					<AIChat
						key={formId}
						formId={formId}
						initialMessages={initialMessages}
						currentSchema={schema}
						onSchemaGenerated={onSchemaChange}
						onOpenSettings={onOpenSettings}
					/>
				)}
			</Tabs.Content>
		</Tabs.Root>
	);
}
