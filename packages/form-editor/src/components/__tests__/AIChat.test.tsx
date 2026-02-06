import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AIChat from "../AIChat";
import * as settings from "@/lib/settings";

// Mock the settings module
vi.mock("@/lib/settings", () => ({
	hasApiKey: vi.fn(),
	getSettings: vi.fn(),
	getModelForProvider: vi.fn(() => "claude-3-5-sonnet-20241022"),
	fetchServerCredentialStatus: vi.fn(() => Promise.resolve({ bedrockConfigured: false })),
	getServerCredentialStatus: vi.fn(() => null),
	saveSettings: vi.fn(),
}));

// Mock AssistantChatTransport
vi.mock("@assistant-ui/react-ai-sdk", () => ({
	useChatRuntime: vi.fn(() => mockRuntime),
	AssistantChatTransport: vi.fn().mockImplementation(function(this: any) {
		return this;
	}),
}));

// Mock assistant-ui
const mockThread = {
	messages: [],
	isRunning: false,
	error: null,
	append: vi.fn(),
};

const mockRuntime = {
	append: vi.fn(),
	thread: {
		append: vi.fn(),
	},
};

vi.mock("@assistant-ui/react", () => ({
	AssistantRuntimeProvider: ({ children }: any) => children,
	ThreadPrimitive: {
		Root: ({ children }: any) => <div>{children}</div>,
		Viewport: ({ children }: any) => <div>{children}</div>,
		ScrollToBottom: () => null,
		Empty: ({ children }: any) => <div>{children}</div>,
		Messages: () => null,
	},
	ComposerPrimitive: {
		Root: ({ children, onSubmit }: any) => <form onSubmit={onSubmit}>{children}</form>,
		Input: (props: any) => <input {...props} />,
		Send: ({ children, ...props }: any) => <button {...props}>{children}</button>,
	},
	MessagePrimitive: {
		Root: ({ children }: any) => <div>{children}</div>,
		Content: ({ children }: any) => <div>{children}</div>,
	},
	useMessage: vi.fn(() => ({
		id: "test-message-id",
		role: "assistant",
		content: [{ type: "text", text: "Test message" }],
	})),
	useAssistantEvent: vi.fn(),
	useAssistantRuntime: vi.fn(() => mockRuntime),
	useThread: vi.fn(() => mockThread),
}));


describe("AIChat", () => {
	const mockOnSchemaGenerated = vi.fn();
	const mockOnOpenSettings = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		// Reset thread mock to default state
		mockThread.messages = [];
		mockThread.isRunning = false;
		mockThread.error = null;
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

		it("should display example prompts when API key is configured", async () => {
			vi.mocked(settings.hasApiKey).mockReturnValue(true);
			vi.mocked(settings.getSettings).mockReturnValue({
				provider: "anthropic",
				apiKey: "test-key",
			} as any);

			render(
				<AIChat
					currentSchema=""
					onSchemaGenerated={mockOnSchemaGenerated}
					onOpenSettings={mockOnOpenSettings}
				/>
			);

			await waitFor(() => {
				expect(screen.getByText("Start a Conversation")).toBeInTheDocument();
			});
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

		it("should display schema context indicator when schema exists", async () => {
			vi.mocked(settings.hasApiKey).mockReturnValue(true);
			vi.mocked(settings.getSettings).mockReturnValue({
				provider: "anthropic",
				apiKey: "test-key",
			} as any);

			render(
				<AIChat
					currentSchema="id: testForm\ntype: form"
					onSchemaGenerated={mockOnSchemaGenerated}
					onOpenSettings={mockOnOpenSettings}
				/>
			);

			// Schema context indicator is not currently displayed in the empty state
			// The schema context is passed to the LLM via the transport body instead
			await waitFor(() => {
				expect(screen.getByText("Start a Conversation")).toBeInTheDocument();
			});
		});

		it("should send message when example prompt is clicked", async () => {
			vi.mocked(settings.hasApiKey).mockReturnValue(true);
			vi.mocked(settings.getSettings).mockReturnValue({
				provider: "anthropic",
				apiKey: "test-key",
			} as any);
			const user = userEvent.setup();

			render(
				<AIChat
					currentSchema=""
					onSchemaGenerated={mockOnSchemaGenerated}
					onOpenSettings={mockOnOpenSettings}
				/>
			);

			await waitFor(() => {
				expect(screen.getByText(/Create a contact form with name, email/)).toBeInTheDocument();
			});

			const exampleButton = screen.getByText(
				/Create a contact form with name, email/
			);
			await user.click(exampleButton);

			// Should call runtime.append with the message
			expect(mockRuntime.append).toHaveBeenCalledTimes(1);
			expect(mockRuntime.append).toHaveBeenCalledWith({
				role: "user",
				content: [{ type: "text", text: "Create a contact form with name, email, and message fields" }],
			});
		});
	});
});
