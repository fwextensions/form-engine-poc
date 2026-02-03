import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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

// Mock AIChat component
vi.mock("../AIChat", () => ({
	default: ({ currentSchema, onSchemaGenerated, onOpenSettings }: any) => (
		<div data-testid="ai-chat">
			<div data-testid="current-schema">{currentSchema}</div>
			<button
				data-testid="generate-schema"
				onClick={() => onSchemaGenerated("generated: schema")}
			>
				Generate
			</button>
			<button data-testid="open-settings" onClick={onOpenSettings}>
				Settings
			</button>
		</div>
	),
}));

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
			/>
		);

		expect(screen.getByText("YAML Editor")).toBeInTheDocument();
		expect(screen.getByText("AI Assistant")).toBeInTheDocument();
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
			/>
		);

		const aiTab = screen.getByText("AI Assistant");
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
			/>
		);

		const yamlTab = screen.getByText("YAML Editor");
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
			/>
		);

		const editor = screen.getByTestId("monaco-editor");
		await user.clear(editor);
		await user.type(editor, "new schema");

		expect(mockOnSchemaChange).toHaveBeenCalled();
	});

	it("passes schema to AIChat component", () => {
		const testSchema = "id: myForm\ntype: form";

		render(
			<EditorPane
				schema={testSchema}
				onSchemaChange={mockOnSchemaChange}
				activeTab="ai"
				onTabChange={mockOnTabChange}
				onOpenSettings={mockOnOpenSettings}
			/>
		);

		const currentSchemaElement = screen.getByTestId("current-schema");
		expect(currentSchemaElement.textContent).toBe(testSchema);
	});

	it("calls onSchemaChange when AIChat generates schema", async () => {
		const user = userEvent.setup();

		render(
			<EditorPane
				schema="id: test"
				onSchemaChange={mockOnSchemaChange}
				activeTab="ai"
				onTabChange={mockOnTabChange}
				onOpenSettings={mockOnOpenSettings}
			/>
		);

		const generateButton = screen.getByTestId("generate-schema");
		await user.click(generateButton);

		expect(mockOnSchemaChange).toHaveBeenCalledWith("generated: schema");
	});

	it("passes onOpenSettings to AIChat component", async () => {
		const user = userEvent.setup();

		render(
			<EditorPane
				schema="id: test"
				onSchemaChange={mockOnSchemaChange}
				activeTab="ai"
				onTabChange={mockOnTabChange}
				onOpenSettings={mockOnOpenSettings}
			/>
		);

		const settingsButton = screen.getByTestId("open-settings");
		await user.click(settingsButton);

		expect(mockOnOpenSettings).toHaveBeenCalled();
	});

	it("preserves schema state when switching tabs", async () => {
		const user = userEvent.setup();
		const testSchema = "id: myForm\ntype: form";

		const { rerender } = render(
			<EditorPane
				schema={testSchema}
				onSchemaChange={mockOnSchemaChange}
				activeTab="yaml"
				onTabChange={mockOnTabChange}
				onOpenSettings={mockOnOpenSettings}
			/>
		);

		// Verify schema in YAML tab
		expect(screen.getByTestId("monaco-editor")).toHaveValue(testSchema);

		// Switch to AI tab
		rerender(
			<EditorPane
				schema={testSchema}
				onSchemaChange={mockOnSchemaChange}
				activeTab="ai"
				onTabChange={mockOnTabChange}
				onOpenSettings={mockOnOpenSettings}
			/>
		);

		// Verify schema is passed to AI tab
		const currentSchemaElement = screen.getByTestId("current-schema");
		expect(currentSchemaElement.textContent).toBe(testSchema);

		// Switch back to YAML tab
		rerender(
			<EditorPane
				schema={testSchema}
				onSchemaChange={mockOnSchemaChange}
				activeTab="yaml"
				onTabChange={mockOnTabChange}
				onOpenSettings={mockOnOpenSettings}
			/>
		);

		// Verify schema is still preserved
		expect(screen.getByTestId("monaco-editor")).toHaveValue(testSchema);
	});
});
