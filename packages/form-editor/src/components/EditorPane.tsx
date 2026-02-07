"use client";

import React from "react";
import * as Tabs from "@radix-ui/react-tabs";
import Editor from "@monaco-editor/react";
import AIChat from "./AIChat";
import AIChatJsonl from "./AIChatJsonl";
import type { SchemaComponent, PatchOp } from "@/lib/jsonl";

interface EditorPaneProps {
	schema: string;
	onSchemaChange: (schema: string) => void;
	activeTab: "yaml" | "ai";
	onTabChange: (tab: "yaml" | "ai") => void;
	onOpenSettings: () => void;
	/** JSONL mode props — when provided, uses patch-based AI editing */
	jsonlMode?: {
		currentSchema: SchemaComponent | null;
		onSchemaChange: (schema: SchemaComponent, patches: PatchOp[], userMessage: string) => void;
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
 */
export default function EditorPane({
	schema,
	onSchemaChange,
	activeTab,
	onTabChange,
	onOpenSettings,
	jsonlMode,
}: EditorPaneProps) {
	return (
		<Tabs.Root
			value={activeTab}
			onValueChange={(value) => onTabChange(value as "yaml" | "ai")}
			className="flex flex-col h-full"
		>
			{/* Tab List */}
			<Tabs.List className="flex border-b border-slate-200 bg-slate-50">
				<Tabs.Trigger
					value="yaml"
					className="px-6 py-3 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:bg-white"
				>
					YAML Editor
				</Tabs.Trigger>
				<Tabs.Trigger
					value="ai"
					className="px-6 py-3 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:bg-white"
				>
					AI Assistant
				</Tabs.Trigger>
			</Tabs.List>

			{/* YAML Editor Tab Content */}
			<Tabs.Content value="yaml" className="flex-1 overflow-hidden">
				<Editor
					height="100%"
					language="yaml"
					value={schema}
					onChange={(value) => onSchemaChange(value || "")}
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
						currentSchema={jsonlMode.currentSchema}
						onSchemaChange={jsonlMode.onSchemaChange}
						onOpenSettings={onOpenSettings}
					/>
				) : (
					<AIChat
						currentSchema={schema}
						onSchemaGenerated={onSchemaChange}
						onOpenSettings={onOpenSettings}
					/>
				)}
			</Tabs.Content>
		</Tabs.Root>
	);
}
