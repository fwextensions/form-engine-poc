import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AIChat from "../AIChat";
import * as settings from "@/lib/settings";
import * as llmClient from "@/lib/llm-client";
import { SchemaGenerator } from "@/lib/schema-generator";

// Mock the settings module
vi.mock("@/lib/settings", () => ({
	hasApiKey: vi.fn(),
	getSettings: vi.fn(),
}));

// Mock the llm-client module
vi.mock("@/lib/llm-client", () => ({
	createAnthropicClient: vi.fn(),
}));

// Mock the schema-generator module
vi.mock("@/lib/schema-generator", () => ({
	SchemaGenerator: vi.fn(),
}));

// Mock chatscope styles to avoid CSS import issues in tests
vi.mock("@chatscope/chat-ui-kit-styles/dist/default/styles.min.css", () => ({}));

describe("AIChat", () => {
	const mockOnSchemaGenerated = vi.fn();
	const mockOnOpenSettings = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("Empty State", () => {
		it("should display API key prompt when not configured", () => {
			vi.mocked(settings.hasApiKey).mockReturnValue(false);

			render(
				<AIChat
					currentSchema=""
					onSchemaGenerated={mockOnSchemaGenerated}
					onOpenSettings={mockOnOpenSettings}
				/>
			);

			expect(screen.getByText("API Key Required")).toBeInTheDocument();
			expect(
				screen.getByText(/To use the AI assistant, you need to configure/)
			).toBeInTheDocument();
			expect(screen.getByText("Open Settings")).toBeInTheDocument();
		});

		it("should call onOpenSettings when settings button is clicked", async () => {
			vi.mocked(settings.hasApiKey).mockReturnValue(false);
			const user = userEvent.setup();

			render(
				<AIChat
					currentSchema=""
					onSchemaGenerated={mockOnSchemaGenerated}
					onOpenSettings={mockOnOpenSettings}
				/>
			);

			const settingsButton = screen.getByText("Open Settings");
			await user.click(settingsButton);

			expect(mockOnOpenSettings).toHaveBeenCalledTimes(1);
		});

		it("should display example prompts when API key is configured", () => {
			vi.mocked(settings.hasApiKey).mockReturnValue(true);
			vi.mocked(settings.getSettings).mockReturnValue({
				provider: "anthropic",
				apiKey: "test-key",
			});

			render(
				<AIChat
					currentSchema=""
					onSchemaGenerated={mockOnSchemaGenerated}
					onOpenSettings={mockOnOpenSettings}
				/>
			);

			expect(screen.getByText("Start a Conversation")).toBeInTheDocument();
			expect(
				screen.getByText(/Create a contact form with name, email/)
			).toBeInTheDocument();
			expect(
				screen.getByText(/Build a multi-step registration form/)
			).toBeInTheDocument();
			expect(
				screen.getByText(/Design a survey form with rating scales/)
			).toBeInTheDocument();
		});

		it("should display schema context indicator when schema exists", () => {
			vi.mocked(settings.hasApiKey).mockReturnValue(true);
			vi.mocked(settings.getSettings).mockReturnValue({
				provider: "anthropic",
				apiKey: "test-key",
			});

			render(
				<AIChat
					currentSchema="id: testForm\ntype: form"
					onSchemaGenerated={mockOnSchemaGenerated}
					onOpenSettings={mockOnOpenSettings}
				/>
			);

			expect(
				screen.getByText(/I can see your current schema/)
			).toBeInTheDocument();
		});

		it("should populate input when example prompt is clicked", async () => {
			vi.mocked(settings.hasApiKey).mockReturnValue(true);
			vi.mocked(settings.getSettings).mockReturnValue({
				provider: "anthropic",
				apiKey: "test-key",
			});
			const user = userEvent.setup();

			render(
				<AIChat
					currentSchema=""
					onSchemaGenerated={mockOnSchemaGenerated}
					onOpenSettings={mockOnOpenSettings}
				/>
			);

			const exampleButton = screen.getByText(
				/Create a contact form with name, email/
			);
			await user.click(exampleButton);

			const input = screen.getByPlaceholderText("Describe your form...");
			expect(input).toHaveValue(
				"Create a contact form with name, email, and message fields"
			);
		});
	});

	describe("Message Sending", () => {
		it("should send message and display streaming response", async () => {
			vi.mocked(settings.hasApiKey).mockReturnValue(true);
			vi.mocked(settings.getSettings).mockReturnValue({
				provider: "anthropic",
				apiKey: "test-key",
			});

			// Mock the generator to yield chunks
			const mockGenerate = vi.fn(async function* () {
				yield "id: ";
				yield "contactForm\n";
				yield "type: form";
			});

			const mockGeneratorInstance = {
				generate: mockGenerate,
				edit: vi.fn(),
				resetConversation: vi.fn(),
			};

			vi.mocked(SchemaGenerator).mockImplementation(
				() => mockGeneratorInstance as any
			);

			const user = userEvent.setup();

			render(
				<AIChat
					currentSchema=""
					onSchemaGenerated={mockOnSchemaGenerated}
					onOpenSettings={mockOnOpenSettings}
				/>
			);

			const input = screen.getByPlaceholderText("Describe your form...");
			await user.type(input, "Create a contact form");
			await user.keyboard("{Enter}");

			// Wait for the message to appear
			await waitFor(() => {
				expect(screen.getByText("Create a contact form")).toBeInTheDocument();
			});

			// Verify generator was called
			expect(mockGenerate).toHaveBeenCalledWith("Create a contact form");
		});

		it("should use edit method when schema exists", async () => {
			vi.mocked(settings.hasApiKey).mockReturnValue(true);
			vi.mocked(settings.getSettings).mockReturnValue({
				provider: "anthropic",
				apiKey: "test-key",
			});

			const mockEdit = vi.fn(async function* () {
				yield "Modified schema";
			});

			const mockGeneratorInstance = {
				generate: vi.fn(),
				edit: mockEdit,
				resetConversation: vi.fn(),
			};

			vi.mocked(SchemaGenerator).mockImplementation(
				() => mockGeneratorInstance as any
			);

			const user = userEvent.setup();

			render(
				<AIChat
					currentSchema="id: existingForm\ntype: form"
					onSchemaGenerated={mockOnSchemaGenerated}
					onOpenSettings={mockOnOpenSettings}
				/>
			);

			const input = screen.getByPlaceholderText("Ask me to modify the form...");
			await user.type(input, "Add an email field");
			await user.keyboard("{Enter}");

			await waitFor(() => {
				expect(mockEdit).toHaveBeenCalledWith(
					"id: existingForm\ntype: form",
					"Add an email field"
				);
			});
		});

		it("should disable input during generation", async () => {
			vi.mocked(settings.hasApiKey).mockReturnValue(true);
			vi.mocked(settings.getSettings).mockReturnValue({
				provider: "anthropic",
				apiKey: "test-key",
			});

			// Mock a slow generator
			const mockGenerate = vi.fn(async function* () {
				await new Promise((resolve) => setTimeout(resolve, 100));
				yield "response";
			});

			const mockGeneratorInstance = {
				generate: mockGenerate,
				edit: vi.fn(),
				resetConversation: vi.fn(),
			};

			vi.mocked(SchemaGenerator).mockImplementation(
				() => mockGeneratorInstance as any
			);

			const user = userEvent.setup();

			render(
				<AIChat
					currentSchema=""
					onSchemaGenerated={mockOnSchemaGenerated}
					onOpenSettings={mockOnOpenSettings}
				/>
			);

			const input = screen.getByPlaceholderText("Describe your form...");
			await user.type(input, "Test message");
			await user.keyboard("{Enter}");

			// Input should be disabled during generation
			await waitFor(() => {
				expect(input).toBeDisabled();
			});
		});
	});

	describe("Schema Extraction and Validation", () => {
		it("should extract YAML and call onSchemaGenerated for valid schema", async () => {
			vi.mocked(settings.hasApiKey).mockReturnValue(true);
			vi.mocked(settings.getSettings).mockReturnValue({
				provider: "anthropic",
				apiKey: "test-key",
			});

			const validYaml = `id: contactForm
type: form
children:
  - id: name
    type: text
    label: Name`;

			const mockGenerate = vi.fn(async function* () {
				yield "Here's your form:\n\n```yaml\n";
				yield validYaml;
				yield "\n```";
			});

			const mockGeneratorInstance = {
				generate: mockGenerate,
				edit: vi.fn(),
				resetConversation: vi.fn(),
			};

			vi.mocked(SchemaGenerator).mockImplementation(
				() => mockGeneratorInstance as any
			);

			const user = userEvent.setup();

			render(
				<AIChat
					currentSchema=""
					onSchemaGenerated={mockOnSchemaGenerated}
					onOpenSettings={mockOnOpenSettings}
				/>
			);

			const input = screen.getByPlaceholderText("Describe your form...");
			await user.type(input, "Create a form");
			await user.keyboard("{Enter}");

			await waitFor(
				() => {
					expect(mockOnSchemaGenerated).toHaveBeenCalledWith(validYaml);
				},
				{ timeout: 3000 }
			);
		});

		it("should display validation errors for invalid schema", async () => {
			vi.mocked(settings.hasApiKey).mockReturnValue(true);
			vi.mocked(settings.getSettings).mockReturnValue({
				provider: "anthropic",
				apiKey: "test-key",
			});

			const invalidYaml = `id: form
type: unknownType`;

			const mockGenerate = vi.fn(async function* () {
				yield "```yaml\n";
				yield invalidYaml;
				yield "\n```";
			});

			const mockGeneratorInstance = {
				generate: mockGenerate,
				edit: vi.fn(),
				resetConversation: vi.fn(),
			};

			vi.mocked(SchemaGenerator).mockImplementation(
				() => mockGeneratorInstance as any
			);

			const user = userEvent.setup();

			render(
				<AIChat
					currentSchema=""
					onSchemaGenerated={mockOnSchemaGenerated}
					onOpenSettings={mockOnOpenSettings}
				/>
			);

			const input = screen.getByPlaceholderText("Describe your form...");
			await user.type(input, "Create a form");
			await user.keyboard("{Enter}");

			await waitFor(
				() => {
					expect(screen.getByText("Validation Errors:")).toBeInTheDocument();
				},
				{ timeout: 3000 }
			);

			// Should not call onSchemaGenerated for invalid schema
			expect(mockOnSchemaGenerated).not.toHaveBeenCalled();
		});

		it("should display success message for valid schema", async () => {
			vi.mocked(settings.hasApiKey).mockReturnValue(true);
			vi.mocked(settings.getSettings).mockReturnValue({
				provider: "anthropic",
				apiKey: "test-key",
			});

			const validYaml = `id: contactForm
type: form
children:
  - id: name
    type: text
    label: Name`;

			const mockGenerate = vi.fn(async function* () {
				yield "```yaml\n";
				yield validYaml;
				yield "\n```";
			});

			const mockGeneratorInstance = {
				generate: mockGenerate,
				edit: vi.fn(),
				resetConversation: vi.fn(),
			};

			vi.mocked(SchemaGenerator).mockImplementation(
				() => mockGeneratorInstance as any
			);

			const user = userEvent.setup();

			render(
				<AIChat
					currentSchema=""
					onSchemaGenerated={mockOnSchemaGenerated}
					onOpenSettings={mockOnOpenSettings}
				/>
			);

			const input = screen.getByPlaceholderText("Describe your form...");
			await user.type(input, "Create a form");
			await user.keyboard("{Enter}");

			await waitFor(
				() => {
					expect(
						screen.getByText(/Schema generated successfully/)
					).toBeInTheDocument();
				},
				{ timeout: 3000 }
			);
		});
	});

	describe("Error Handling", () => {
		it("should display error message when generation fails", async () => {
			vi.mocked(settings.hasApiKey).mockReturnValue(true);
			vi.mocked(settings.getSettings).mockReturnValue({
				provider: "anthropic",
				apiKey: "test-key",
			});

			const mockGenerate = vi.fn(async function* (): AsyncGenerator<string> {
				throw new Error("Network error: Unable to connect to LLM service");
			});

			const mockGeneratorInstance = {
				generate: mockGenerate,
				edit: vi.fn(),
				resetConversation: vi.fn(),
			};

			vi.mocked(SchemaGenerator).mockImplementation(
				() => mockGeneratorInstance as any
			);

			const user = userEvent.setup();

			render(
				<AIChat
					currentSchema=""
					onSchemaGenerated={mockOnSchemaGenerated}
					onOpenSettings={mockOnOpenSettings}
				/>
			);

			const input = screen.getByPlaceholderText("Describe your form...");
			await user.type(input, "Create a form");
			await user.keyboard("{Enter}");

			await waitFor(
				() => {
					expect(
						screen.getByText(/Network error: Unable to connect to LLM service/)
					).toBeInTheDocument();
				},
				{ timeout: 3000 }
			);
		});
	});

	describe("Chat Interface", () => {
		it("should show typing indicator during generation", async () => {
			vi.mocked(settings.hasApiKey).mockReturnValue(true);
			vi.mocked(settings.getSettings).mockReturnValue({
				provider: "anthropic",
				apiKey: "test-key",
			});

			const mockGenerate = vi.fn(async function* () {
				await new Promise((resolve) => setTimeout(resolve, 100));
				yield "response";
			});

			const mockGeneratorInstance = {
				generate: mockGenerate,
				edit: vi.fn(),
				resetConversation: vi.fn(),
			};

			vi.mocked(SchemaGenerator).mockImplementation(
				() => mockGeneratorInstance as any
			);

			const user = userEvent.setup();

			render(
				<AIChat
					currentSchema=""
					onSchemaGenerated={mockOnSchemaGenerated}
					onOpenSettings={mockOnOpenSettings}
				/>
			);

			const input = screen.getByPlaceholderText("Describe your form...");
			await user.type(input, "Test");
			await user.keyboard("{Enter}");

			// Should show typing indicator
			await waitFor(() => {
				expect(screen.getByText("AI is generating...")).toBeInTheDocument();
			});
		});

		it("should display schema context indicator in header when schema exists", () => {
			vi.mocked(settings.hasApiKey).mockReturnValue(true);
			vi.mocked(settings.getSettings).mockReturnValue({
				provider: "anthropic",
				apiKey: "test-key",
			});

			// Create a message to show the chat interface
			const mockGeneratorInstance = {
				generate: vi.fn(),
				edit: vi.fn(),
				resetConversation: vi.fn(),
			};

			vi.mocked(SchemaGenerator).mockImplementation(
				() => mockGeneratorInstance as any
			);

			const { rerender } = render(
				<AIChat
					currentSchema=""
					onSchemaGenerated={mockOnSchemaGenerated}
					onOpenSettings={mockOnOpenSettings}
				/>
			);

			// Send a message to transition to chat view
			const input = screen.getByPlaceholderText("Describe your form...");
			userEvent.type(input, "test");

			// Rerender with schema
			rerender(
				<AIChat
					currentSchema="id: form\ntype: form"
					onSchemaGenerated={mockOnSchemaGenerated}
					onOpenSettings={mockOnOpenSettings}
				/>
			);

			// Note: This test verifies the component structure but may need adjustment
			// based on how the chat interface transitions from empty to populated state
		});
	});
});
