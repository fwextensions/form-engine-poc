/**
 * Integration tests for AIChat component's use of useChat hook state
 * 
 * Validates Requirements: 5.3, 5.4, 8.3
 * - 5.3: Stream completion updates status
 * - 5.4: Streaming errors are exposed for display
 * - 8.3: Network errors are exposed for display
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import AIChat from "../AIChat";
import * as settings from "@/lib/settings";
import { useChat } from "@ai-sdk/react";

// Mock the settings module
vi.mock("@/lib/settings", () => ({
	hasApiKey: vi.fn(),
	getSettings: vi.fn(),
}));

// Mock the useChat hook
vi.mock("@ai-sdk/react", () => ({
	useChat: vi.fn(),
}));

// Mock chatscope styles
vi.mock("@chatscope/chat-ui-kit-styles/dist/default/styles.min.css", () => ({}));

describe("AIChat - useChat State Integration", () => {
	const mockOnSchemaGenerated = vi.fn();
	const mockOnOpenSettings = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(settings.hasApiKey).mockReturnValue(true);
		vi.mocked(settings.getSettings).mockReturnValue({
			provider: "anthropic",
			apiKey: "test-key",
		});
	});

	describe("Status for Loading Indicators (Requirement 5.3)", () => {
		it("should show typing indicator when status is 'streaming'", () => {
			vi.mocked(useChat).mockReturnValue({
				messages: [
					{
						id: "1",
						role: "user",
						parts: [{ type: "text", text: "Test message" }],
					},
				],
				sendMessage: vi.fn(),
				status: "streaming",
				error: undefined,
			} as any);

			render(
				<AIChat
					currentSchema=""
					onSchemaGenerated={mockOnSchemaGenerated}
					onOpenSettings={mockOnOpenSettings}
				/>
			);

			expect(screen.getByText("AI is generating...")).toBeInTheDocument();
		});

		it("should show typing indicator when status is 'submitted'", () => {
			vi.mocked(useChat).mockReturnValue({
				messages: [
					{
						id: "1",
						role: "user",
						parts: [{ type: "text", text: "Test message" }],
					},
				],
				sendMessage: vi.fn(),
				status: "submitted",
				error: undefined,
			} as any);

			render(
				<AIChat
					currentSchema=""
					onSchemaGenerated={mockOnSchemaGenerated}
					onOpenSettings={mockOnOpenSettings}
				/>
			);

			expect(screen.getByText("AI is generating...")).toBeInTheDocument();
		});

		it("should NOT show typing indicator when status is 'idle'", () => {
			vi.mocked(useChat).mockReturnValue({
				messages: [
					{
						id: "1",
						role: "user",
						parts: [{ type: "text", text: "Test message" }],
					},
				],
				sendMessage: vi.fn(),
				status: "idle",
				error: undefined,
			} as any);

			render(
				<AIChat
					currentSchema=""
					onSchemaGenerated={mockOnSchemaGenerated}
					onOpenSettings={mockOnOpenSettings}
				/>
			);

			expect(screen.queryByText("AI is generating...")).not.toBeInTheDocument();
		});

		it("should disable input when status indicates loading", () => {
			vi.mocked(useChat).mockReturnValue({
				messages: [],
				sendMessage: vi.fn(),
				status: "streaming",
				error: undefined,
			} as any);

			const { container } = render(
				<AIChat
					currentSchema=""
					onSchemaGenerated={mockOnSchemaGenerated}
					onOpenSettings={mockOnOpenSettings}
				/>
			);

			// The MessageInput component uses a contenteditable div with data-placeholder
			const input = container.querySelector('[data-placeholder="Describe your form..."]');
			expect(input).toBeTruthy();
			expect(input).toHaveAttribute("contenteditable", "false");
		});
	});

	describe("Error Display (Requirements 5.4, 8.3)", () => {
		it("should display error message when error is present", () => {
			const testError = new Error("Network error: Unable to connect to LLM service");
			
			vi.mocked(useChat).mockReturnValue({
				messages: [
					{
						id: "1",
						role: "user",
						parts: [{ type: "text", text: "Test message" }],
					},
				],
				sendMessage: vi.fn(),
				status: "idle",
				error: testError,
			} as any);

			render(
				<AIChat
					currentSchema=""
					onSchemaGenerated={mockOnSchemaGenerated}
					onOpenSettings={mockOnOpenSettings}
				/>
			);

			expect(screen.getByText("Error")).toBeInTheDocument();
			expect(
				screen.getByText("Network error: Unable to connect to LLM service")
			).toBeInTheDocument();
		});

		it("should display authentication error", () => {
			const authError = new Error("Authentication failed: Please check your API key");
			
			vi.mocked(useChat).mockReturnValue({
				messages: [
					{
						id: "1",
						role: "user",
						parts: [{ type: "text", text: "Test message" }],
					},
				],
				sendMessage: vi.fn(),
				status: "idle",
				error: authError,
			} as any);

			render(
				<AIChat
					currentSchema=""
					onSchemaGenerated={mockOnSchemaGenerated}
					onOpenSettings={mockOnOpenSettings}
				/>
			);

			expect(
				screen.getByText("Authentication failed: Please check your API key")
			).toBeInTheDocument();
		});

		it("should display rate limit error", () => {
			const rateLimitError = new Error("Rate limit exceeded: Please wait before retrying");
			
			vi.mocked(useChat).mockReturnValue({
				messages: [
					{
						id: "1",
						role: "user",
						parts: [{ type: "text", text: "Test message" }],
					},
				],
				sendMessage: vi.fn(),
				status: "idle",
				error: rateLimitError,
			} as any);

			render(
				<AIChat
					currentSchema=""
					onSchemaGenerated={mockOnSchemaGenerated}
					onOpenSettings={mockOnOpenSettings}
				/>
			);

			expect(
				screen.getByText("Rate limit exceeded: Please wait before retrying")
			).toBeInTheDocument();
		});

		it("should show fallback message for errors without message property", () => {
			vi.mocked(useChat).mockReturnValue({
				messages: [
					{
						id: "1",
						role: "user",
						parts: [{ type: "text", text: "Test message" }],
					},
				],
				sendMessage: vi.fn(),
				status: "idle",
				error: {} as Error,
			} as any);

			render(
				<AIChat
					currentSchema=""
					onSchemaGenerated={mockOnSchemaGenerated}
					onOpenSettings={mockOnOpenSettings}
				/>
			);

			expect(screen.getByText("An unexpected error occurred")).toBeInTheDocument();
		});

		it("should NOT display error when error is undefined", () => {
			vi.mocked(useChat).mockReturnValue({
				messages: [
					{
						id: "1",
						role: "user",
						parts: [{ type: "text", text: "Test message" }],
					},
				],
				sendMessage: vi.fn(),
				status: "idle",
				error: undefined,
			} as any);

			render(
				<AIChat
					currentSchema=""
					onSchemaGenerated={mockOnSchemaGenerated}
					onOpenSettings={mockOnOpenSettings}
				/>
			);

			expect(screen.queryByText("Error")).not.toBeInTheDocument();
		});
	});

	describe("Messages Rendering (Requirement 5.1, 5.2)", () => {
		it("should render messages from useChat", () => {
			vi.mocked(useChat).mockReturnValue({
				messages: [
					{
						id: "1",
						role: "user",
						parts: [{ type: "text", text: "Create a contact form" }],
					},
					{
						id: "2",
						role: "assistant",
						parts: [{ type: "text", text: "Here's your contact form" }],
					},
				],
				sendMessage: vi.fn(),
				status: "idle",
				error: undefined,
			} as any);

			render(
				<AIChat
					currentSchema=""
					onSchemaGenerated={mockOnSchemaGenerated}
					onOpenSettings={mockOnOpenSettings}
				/>
			);

			expect(screen.getByText("Create a contact form")).toBeInTheDocument();
			expect(screen.getByText("Here's your contact form")).toBeInTheDocument();
		});

		it("should handle messages with multiple text parts", () => {
			vi.mocked(useChat).mockReturnValue({
				messages: [
					{
						id: "1",
						role: "assistant",
						parts: [
							{ type: "text", text: "Part 1 " },
							{ type: "text", text: "Part 2" },
						],
					},
				],
				sendMessage: vi.fn(),
				status: "idle",
				error: undefined,
			} as any);

			render(
				<AIChat
					currentSchema=""
					onSchemaGenerated={mockOnSchemaGenerated}
					onOpenSettings={mockOnOpenSettings}
				/>
			);

			expect(screen.getByText("Part 1 Part 2")).toBeInTheDocument();
		});
	});
});
