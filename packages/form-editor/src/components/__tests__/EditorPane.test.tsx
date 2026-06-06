import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EditorPane from "../EditorPane";

// Mock Monaco Editor
vi.mock("@monaco-editor/react", () => ({
	default: ({ value, onChange }: any) => (
		<textarea
			data-testid="monaco-editor"
			value={value}
			onChange={(e) => onChange(e.target.value)}
		/>
	),
}));

// Mock AIChatJsonl component
vi.mock("../AIChatJsonl", () => ({
	default: ({ onOpenSettings }: any) => (
		<div data-testid="ai-chat">
			<button data-testid="open-settings" onClick={onOpenSettings}>
				Settings
			</button>
		</div>
	),
}));

const defaultJsonlMode = {
	currentSchema: null,
	onSchemaChange: vi.fn(),
};

describe("EditorPane", () => {
	const mockOnSchemaChange = vi.fn();
	const mockOnTabChange = vi.fn();
	const mockOnOpenSettings = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders with YAML tab active by default", () => {
		render(
			<EditorPane
				schema="id: test"
				onSchemaChange={mockOnSchemaChange}
				activeTab="yaml"
				onTabChange={mockOnTabChange}
				onOpenSettings={mockOnOpenSettings}
				formId="test-form"
				initialMessages={[]}
				jsonlMode={defaultJsonlMode}
			/>
		);

		expect(screen.getByText("YAML editor")).toBeInTheDocument();
		expect(screen.getByText("AI assistant")).toBeInTheDocument();
		expect(screen.getByTestId("monaco-editor")).toBeInTheDocument();
	});

	it("renders with AI tab active when specified", () => {
		render(
			<EditorPane
				schema="id: test"
				onSchemaChange={mockOnSchemaChange}
				activeTab="ai"
				onTabChange={mockOnTabChange}
				onOpenSettings={mockOnOpenSettings}
				formId="test-form"
				initialMessages={[]}
				jsonlMode={defaultJsonlMode}
			/>
		);

		expect(screen.getByTestId("ai-chat")).toBeInTheDocument();
	});

	it("switches to AI tab when clicked", async () => {
		const user = userEvent.setup();

		render(
			<EditorPane
				schema="id: test"
				onSchemaChange={mockOnSchemaChange}
				activeTab="yaml"
				onTabChange={mockOnTabChange}
				onOpenSettings={mockOnOpenSettings}
				formId="test-form"
				initialMessages={[]}
				jsonlMode={defaultJsonlMode}
			/>
		);

		const aiTab = screen.getByText("AI assistant");
		await user.click(aiTab);

		expect(mockOnTabChange).toHaveBeenCalledWith("ai");
	});

	it("switches to YAML tab when clicked", async () => {
		const user = userEvent.setup();

		render(
			<EditorPane
				schema="id: test"
				onSchemaChange={mockOnSchemaChange}
				activeTab="ai"
				onTabChange={mockOnTabChange}
				onOpenSettings={mockOnOpenSettings}
				formId="test-form"
				initialMessages={[]}
				jsonlMode={defaultJsonlMode}
			/>
		);

		const yamlTab = screen.getByText("YAML editor");
		await user.click(yamlTab);

		expect(mockOnTabChange).toHaveBeenCalledWith("yaml");
	});

	it("passes schema to Monaco editor", () => {
		const testSchema = "id: myForm\ntype: form";

		render(
			<EditorPane
				schema={testSchema}
				onSchemaChange={mockOnSchemaChange}
				activeTab="yaml"
				onTabChange={mockOnTabChange}
				onOpenSettings={mockOnOpenSettings}
				formId="test-form"
				initialMessages={[]}
				jsonlMode={defaultJsonlMode}
			/>
		);

		const editor = screen.getByTestId("monaco-editor");
		expect(editor).toHaveValue(testSchema);
	});

	it("calls onSchemaChange when Monaco editor content changes", async () => {
		const user = userEvent.setup();

		render(
			<EditorPane
				schema="id: test"
				onSchemaChange={mockOnSchemaChange}
				activeTab="yaml"
				onTabChange={mockOnTabChange}
				onOpenSettings={mockOnOpenSettings}
				formId="test-form"
				initialMessages={[]}
				jsonlMode={defaultJsonlMode}
			/>
		);

		const editor = screen.getByTestId("monaco-editor");
		await user.clear(editor);
		await user.type(editor, "new schema");

		expect(mockOnSchemaChange).toHaveBeenCalled();
	});

	it("passes onOpenSettings to AIChatJsonl component", async () => {
		const user = userEvent.setup();

		render(
			<EditorPane
				schema="id: test"
				onSchemaChange={mockOnSchemaChange}
				activeTab="ai"
				onTabChange={mockOnTabChange}
				onOpenSettings={mockOnOpenSettings}
				formId="test-form"
				initialMessages={[]}
				jsonlMode={defaultJsonlMode}
			/>
		);

		const settingsButton = screen.getByTestId("open-settings");
		await user.click(settingsButton);

		expect(mockOnOpenSettings).toHaveBeenCalled();
	});

	it("preserves schema in YAML editor when switching tabs", () => {
		const testSchema = "id: myForm\ntype: form";

		const { rerender } = render(
			<EditorPane
				schema={testSchema}
				onSchemaChange={mockOnSchemaChange}
				activeTab="yaml"
				onTabChange={mockOnTabChange}
				onOpenSettings={mockOnOpenSettings}
				formId="test-form"
				initialMessages={[]}
				jsonlMode={defaultJsonlMode}
			/>
		);

		expect(screen.getByTestId("monaco-editor")).toHaveValue(testSchema);

		// Switch to AI tab
		rerender(
			<EditorPane
				schema={testSchema}
				onSchemaChange={mockOnSchemaChange}
				activeTab="ai"
				onTabChange={mockOnTabChange}
				onOpenSettings={mockOnOpenSettings}
				formId="test-form"
				initialMessages={[]}
				jsonlMode={defaultJsonlMode}
			/>
		);

		expect(screen.getByTestId("ai-chat")).toBeInTheDocument();

		// Switch back to YAML tab
		rerender(
			<EditorPane
				schema={testSchema}
				onSchemaChange={mockOnSchemaChange}
				activeTab="yaml"
				onTabChange={mockOnTabChange}
				onOpenSettings={mockOnOpenSettings}
				formId="test-form"
				initialMessages={[]}
				jsonlMode={defaultJsonlMode}
			/>
		);

		expect(screen.getByTestId("monaco-editor")).toHaveValue(testSchema);
	});
});
