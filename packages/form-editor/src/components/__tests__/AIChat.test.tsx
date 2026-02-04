import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AIChat from "../AIChat";
import * as settings from "@/lib/settings";
import { useChat } from "@ai-sdk/react";

// Mock the settings module
vi.mock("@/lib/settings", () => ({
	hasApiKey: vi.fn(),
	getSettings: vi.fn(),
}));

// Mock the Vercel AI SDK
vi.mock("@ai-sdk/react", () => ({
	useChat: vi.fn(),
}));

// Mock the DefaultChatTransport
vi.mock("ai", () => ({
	DefaultChatTransport: vi.fn(),
}));

// Mock chatscope styles to avoid CSS import issues in tests
vi.mock("@chatscope/chat-ui-kit-styles/dist/default/styles.min.css", () => ({}));

describe("AIChat", () => {
	const mockOnSchemaGenerated = vi.fn();
	const mockOnOpenSettings = vi.fn();
	const mockSendMessage = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		// Reset useChat mock to default state
		vi.mocked(useChat).mockReturnValue({
			messages: [],
			sendMessage: mockSendMessage,
			status: "idle",
			error: null,
		} as any);
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

			// The input is a contenteditable div with data-placeholder attribute
			const input = document.querySelector('[contenteditable="true"]');
			expect(input).toBeTruthy();
			expect(input?.textContent?.trim()).toBe(
				"Create a contact form with name, email, and message fields"
			);
		});
	});
});
