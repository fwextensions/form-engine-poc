/**
 * Unit tests for SettingsDialog component
 * Requirements: 6.1, 6.2, 6.3
 */

import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SettingsDialog from "../SettingsDialog";
import * as settings from "@/lib/settings";

// Mock the settings module
vi.mock("@/lib/settings", () => ({
	getSettings: vi.fn(),
	saveSettings: vi.fn(),
}));

describe("SettingsDialog", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Default mock implementation
		vi.mocked(settings.getSettings).mockReturnValue({
			provider: "anthropic",
			apiKey: "",
			model: "",
		});
	});

	it("should render the dialog when open is true", () => {
		render(<SettingsDialog open={true} onOpenChange={() => {}} />);

		expect(screen.getByText("LLM Settings")).toBeInTheDocument();
		expect(
			screen.getByText(/Configure your LLM provider and API key/i),
		).toBeInTheDocument();
	});

	it("should not render the dialog when open is false", () => {
		render(<SettingsDialog open={false} onOpenChange={() => {}} />);

		expect(screen.queryByText("LLM Settings")).not.toBeInTheDocument();
	});

	it("should display provider dropdown with Anthropic and OpenAI options", () => {
		render(<SettingsDialog open={true} onOpenChange={() => {}} />);

		const providerSelect = screen.getByLabelText("Provider");
		expect(providerSelect).toBeInTheDocument();

		const options = screen.getAllByRole("option");
		expect(options).toHaveLength(2);
		expect(options[0]).toHaveTextContent("Anthropic (Claude)");
		expect(options[1]).toHaveTextContent("OpenAI (GPT)");
	});

	it("should display API key password input", () => {
		render(<SettingsDialog open={true} onOpenChange={() => {}} />);

		const apiKeyInput = screen.getByLabelText("API Key");
		expect(apiKeyInput).toBeInTheDocument();
		expect(apiKeyInput).toHaveAttribute("type", "password");
		expect(apiKeyInput).toHaveAttribute(
			"placeholder",
			"Enter your API key",
		);
	});

	it("should display optional model input", () => {
		render(<SettingsDialog open={true} onOpenChange={() => {}} />);

		const modelInput = screen.getByLabelText("Model (Optional)");
		expect(modelInput).toBeInTheDocument();
		expect(modelInput).toHaveAttribute("type", "text");
	});

	it("should display Save and Cancel buttons", () => {
		render(<SettingsDialog open={true} onOpenChange={() => {}} />);

		expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Cancel" }),
		).toBeInTheDocument();
	});

	it("should load existing settings when dialog opens", () => {
		vi.mocked(settings.getSettings).mockReturnValue({
			provider: "openai",
			apiKey: "test-key-123",
			model: "gpt-4",
		});

		render(<SettingsDialog open={true} onOpenChange={() => {}} />);

		const providerSelect = screen.getByLabelText("Provider") as HTMLSelectElement;
		const apiKeyInput = screen.getByLabelText("API Key") as HTMLInputElement;
		const modelInput = screen.getByLabelText("Model (Optional)") as HTMLInputElement;

		expect(providerSelect.value).toBe("openai");
		expect(apiKeyInput.value).toBe("test-key-123");
		expect(modelInput.value).toBe("gpt-4");
	});

	it("should update provider when dropdown changes", () => {
		render(<SettingsDialog open={true} onOpenChange={() => {}} />);

		const providerSelect = screen.getByLabelText("Provider") as HTMLSelectElement;
		
		fireEvent.change(providerSelect, { target: { value: "openai" } });

		expect(providerSelect.value).toBe("openai");
	});

	it("should update API key when input changes", () => {
		render(<SettingsDialog open={true} onOpenChange={() => {}} />);

		const apiKeyInput = screen.getByLabelText("API Key") as HTMLInputElement;
		
		fireEvent.change(apiKeyInput, { target: { value: "new-api-key" } });

		expect(apiKeyInput.value).toBe("new-api-key");
	});

	it("should update model when input changes", () => {
		render(<SettingsDialog open={true} onOpenChange={() => {}} />);

		const modelInput = screen.getByLabelText("Model (Optional)") as HTMLInputElement;
		
		fireEvent.change(modelInput, { target: { value: "claude-3-opus" } });

		expect(modelInput.value).toBe("claude-3-opus");
	});

	it("should save settings and close dialog when Save is clicked", async () => {
		const onOpenChange = vi.fn();
		render(<SettingsDialog open={true} onOpenChange={onOpenChange} />);

		const providerSelect = screen.getByLabelText("Provider");
		const apiKeyInput = screen.getByLabelText("API Key");
		const modelInput = screen.getByLabelText("Model (Optional)");
		const saveButton = screen.getByRole("button", { name: "Save" });

		fireEvent.change(providerSelect, { target: { value: "openai" } });
		fireEvent.change(apiKeyInput, { target: { value: "test-key" } });
		fireEvent.change(modelInput, { target: { value: "gpt-4" } });
		fireEvent.click(saveButton);

		await waitFor(() => {
			expect(settings.saveSettings).toHaveBeenCalledWith({
				provider: "openai",
				apiKey: "test-key",
				model: "gpt-4",
			});
			expect(onOpenChange).toHaveBeenCalledWith(false);
		});
	});

	it("should trim whitespace from API key and model before saving", async () => {
		const onOpenChange = vi.fn();
		render(<SettingsDialog open={true} onOpenChange={onOpenChange} />);

		const apiKeyInput = screen.getByLabelText("API Key");
		const modelInput = screen.getByLabelText("Model (Optional)");
		const saveButton = screen.getByRole("button", { name: "Save" });

		fireEvent.change(apiKeyInput, { target: { value: "  test-key  " } });
		fireEvent.change(modelInput, { target: { value: "  gpt-4  " } });
		fireEvent.click(saveButton);

		await waitFor(() => {
			expect(settings.saveSettings).toHaveBeenCalledWith({
				provider: "anthropic",
				apiKey: "test-key",
				model: "gpt-4",
			});
		});
	});

	it("should save undefined for empty API key", async () => {
		const onOpenChange = vi.fn();
		render(<SettingsDialog open={true} onOpenChange={onOpenChange} />);

		const saveButton = screen.getByRole("button", { name: "Save" });
		fireEvent.click(saveButton);

		await waitFor(() => {
			expect(settings.saveSettings).toHaveBeenCalledWith({
				provider: "anthropic",
				apiKey: undefined,
				model: undefined,
			});
		});
	});

	it("should close dialog without saving when Cancel is clicked", () => {
		const onOpenChange = vi.fn();
		render(<SettingsDialog open={true} onOpenChange={onOpenChange} />);

		const cancelButton = screen.getByRole("button", { name: "Cancel" });
		fireEvent.click(cancelButton);

		expect(settings.saveSettings).not.toHaveBeenCalled();
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it("should display error alert when save fails", async () => {
		const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
		vi.mocked(settings.saveSettings).mockImplementation(() => {
			throw new Error("Storage quota exceeded");
		});

		render(<SettingsDialog open={true} onOpenChange={() => {}} />);

		const saveButton = screen.getByRole("button", { name: "Save" });
		fireEvent.click(saveButton);

		await waitFor(() => {
			expect(alertSpy).toHaveBeenCalledWith("Storage quota exceeded");
		});

		alertSpy.mockRestore();
	});

	it("should update model placeholder based on selected provider", () => {
		render(<SettingsDialog open={true} onOpenChange={() => {}} />);

		const providerSelect = screen.getByLabelText("Provider");
		const modelInput = screen.getByLabelText("Model (Optional)");

		// Default is Anthropic
		expect(modelInput).toHaveAttribute(
			"placeholder",
			"e.g., claude-3-5-sonnet-20241022",
		);

		// Change to OpenAI
		fireEvent.change(providerSelect, { target: { value: "openai" } });
		expect(modelInput).toHaveAttribute("placeholder", "e.g., gpt-4");

		// Change back to Anthropic
		fireEvent.change(providerSelect, { target: { value: "anthropic" } });
		expect(modelInput).toHaveAttribute(
			"placeholder",
			"e.g., claude-3-5-sonnet-20241022",
		);
	});

	it("should display security notice about local storage", () => {
		render(<SettingsDialog open={true} onOpenChange={() => {}} />);

		expect(
			screen.getByText(/Your API key is stored locally in your browser/i),
		).toBeInTheDocument();
	});

	it("should display help text for optional model field", () => {
		render(<SettingsDialog open={true} onOpenChange={() => {}} />);

		expect(
			screen.getByText(/Leave empty to use the default model/i),
		).toBeInTheDocument();
	});
});
