/**
 * Unit tests for SettingsDialog component
 * Requirements: 6.1, 6.2, 6.3
 */

import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsDialog from "../SettingsDialog";
import * as settings from "@/lib/settings";

// Mock the settings module
vi.mock("@/lib/settings", () => ({
	getSettings: vi.fn(),
	saveSettings: vi.fn(),
	getServerCredentialStatus: vi.fn(),
}));

describe("SettingsDialog", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Default mock implementation - use new per-provider model fields
		vi.mocked(settings.getSettings).mockReturnValue({
			provider: "anthropic",
			apiKey: "",
		});
		// Ensure saveSettings doesn't throw
		vi.mocked(settings.saveSettings).mockImplementation(() => {});
		// Default: no server credentials
		vi.mocked(settings.getServerCredentialStatus).mockReturnValue(null);
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

	it("should display provider dropdown with all four provider options", () => {
		render(<SettingsDialog open={true} onOpenChange={() => {}} />);

		const providerSelect = screen.getByLabelText("Provider");
		expect(providerSelect).toBeInTheDocument();

		const options = screen.getAllByRole("option");
		expect(options).toHaveLength(4);
		expect(options[0]).toHaveTextContent("Anthropic (Claude)");
		expect(options[1]).toHaveTextContent("OpenAI (GPT)");
		expect(options[2]).toHaveTextContent("Google (Gemini)");
		expect(options[3]).toHaveTextContent("Amazon Bedrock");
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
			openaiModel: "gpt-4",
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
			expect(settings.saveSettings).toHaveBeenCalledWith(
				expect.objectContaining({
					provider: "openai",
					apiKey: "test-key",
					openaiModel: "gpt-4",
				})
			);
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
		fireEvent.change(modelInput, { target: { value: "  claude-3-opus  " } });
		fireEvent.click(saveButton);

		await waitFor(() => {
			expect(settings.saveSettings).toHaveBeenCalledWith(
				expect.objectContaining({
					provider: "anthropic",
					apiKey: "test-key",
					anthropicModel: "claude-3-opus",
				})
			);
		});
	});

	it("should save undefined for empty API key", async () => {
		const onOpenChange = vi.fn();
		render(<SettingsDialog open={true} onOpenChange={onOpenChange} />);

		const saveButton = screen.getByRole("button", { name: "Save" });
		fireEvent.click(saveButton);

		await waitFor(() => {
			expect(settings.saveSettings).toHaveBeenCalledWith(
				expect.objectContaining({
					provider: "anthropic",
					apiKey: undefined,
					anthropicModel: undefined,
				})
			);
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
			"e.g., claude-sonnet-4-20250514",
		);

		// Change to OpenAI
		fireEvent.change(providerSelect, { target: { value: "openai" } });
		expect(modelInput).toHaveAttribute("placeholder", "e.g., gpt-4o");

		// Change to Google
		fireEvent.change(providerSelect, { target: { value: "google" } });
		expect(modelInput).toHaveAttribute("placeholder", "e.g., gemini-2.0-flash");

		// Change to Bedrock
		fireEvent.change(providerSelect, { target: { value: "bedrock" } });
		expect(modelInput).toHaveAttribute("placeholder", "e.g., anthropic.claude-3-sonnet-20240229-v1:0");

		// Change back to Anthropic
		fireEvent.change(providerSelect, { target: { value: "anthropic" } });
		expect(modelInput).toHaveAttribute(
			"placeholder",
			"e.g., claude-sonnet-4-20250514",
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

	it("should display API key field for non-Bedrock providers", () => {
		render(<SettingsDialog open={true} onOpenChange={() => {}} />);

		// Default is Anthropic - should show API key
		expect(screen.getByLabelText("API Key")).toBeInTheDocument();
		expect(screen.queryByLabelText("AWS Access Key ID")).not.toBeInTheDocument();

		// Change to OpenAI - should still show API key
		const providerSelect = screen.getByLabelText("Provider");
		fireEvent.change(providerSelect, { target: { value: "openai" } });
		expect(screen.getByLabelText("API Key")).toBeInTheDocument();
		expect(screen.queryByLabelText("AWS Access Key ID")).not.toBeInTheDocument();

		// Change to Google - should still show API key
		fireEvent.change(providerSelect, { target: { value: "google" } });
		expect(screen.getByLabelText("API Key")).toBeInTheDocument();
		expect(screen.queryByLabelText("AWS Access Key ID")).not.toBeInTheDocument();
	});

	it("should display AWS credential fields when Bedrock is selected", () => {
		render(<SettingsDialog open={true} onOpenChange={() => {}} />);

		const providerSelect = screen.getByLabelText("Provider");
		fireEvent.change(providerSelect, { target: { value: "bedrock" } });

		// Should show AWS fields
		expect(screen.getByLabelText("AWS Access Key ID")).toBeInTheDocument();
		expect(screen.getByLabelText("AWS Secret Access Key")).toBeInTheDocument();
		expect(screen.getByLabelText("AWS Region")).toBeInTheDocument();

		// Should NOT show API key field
		expect(screen.queryByLabelText("API Key")).not.toBeInTheDocument();

		// Should show security notice for AWS credentials
		expect(
			screen.getByText(/AWS credentials are stored locally in your browser/i),
		).toBeInTheDocument();
	});

	it("should load AWS credentials when dialog opens with Bedrock provider", () => {
		vi.mocked(settings.getSettings).mockReturnValue({
			provider: "bedrock",
			awsAccessKeyId: "AKIAIOSFODNN7EXAMPLE",
			awsSecretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
			awsRegion: "us-east-1",
			bedrockModel: "anthropic.claude-3-sonnet-20240229-v1:0",
		});

		render(<SettingsDialog open={true} onOpenChange={() => {}} />);

		const providerSelect = screen.getByLabelText("Provider") as HTMLSelectElement;
		const awsAccessKeyInput = screen.getByLabelText("AWS Access Key ID") as HTMLInputElement;
		const awsSecretKeyInput = screen.getByLabelText("AWS Secret Access Key") as HTMLInputElement;
		const awsRegionInput = screen.getByLabelText("AWS Region") as HTMLInputElement;
		const modelInput = screen.getByLabelText("Model (Optional)") as HTMLInputElement;

		expect(providerSelect.value).toBe("bedrock");
		expect(awsAccessKeyInput.value).toBe("AKIAIOSFODNN7EXAMPLE");
		expect(awsSecretKeyInput.value).toBe("wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY");
		expect(awsRegionInput.value).toBe("us-east-1");
		expect(modelInput.value).toBe("anthropic.claude-3-sonnet-20240229-v1:0");
	});

	it("should save AWS credentials when Bedrock is selected", async () => {
		const user = userEvent.setup();
		const onOpenChange = vi.fn();
		render(<SettingsDialog open={true} onOpenChange={onOpenChange} />);

		const providerSelect = screen.getByLabelText("Provider");
		await user.selectOptions(providerSelect, "bedrock");

		// Wait for the provider change to take effect
		await waitFor(() => {
			expect(screen.getByLabelText("AWS Access Key ID")).toBeInTheDocument();
		});

		const awsAccessKeyInput = screen.getByLabelText("AWS Access Key ID");
		const awsSecretKeyInput = screen.getByLabelText("AWS Secret Access Key");
		const awsRegionInput = screen.getByLabelText("AWS Region");
		const modelInput = screen.getByLabelText("Model (Optional)");

		await user.type(awsAccessKeyInput, "AKIAIOSFODNN7EXAMPLE");
		await user.type(awsSecretKeyInput, "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY");
		await user.type(awsRegionInput, "us-west-2");
		await user.type(modelInput, "anthropic.claude-3-sonnet-20240229-v1:0");

		const saveButton = screen.getByRole("button", { name: "Save" });
		await user.click(saveButton);

		await waitFor(() => {
			expect(settings.saveSettings).toHaveBeenCalledWith(
				expect.objectContaining({
					provider: "bedrock",
					apiKey: undefined,
					bedrockModel: "anthropic.claude-3-sonnet-20240229-v1:0",
					bedrockAuthMethod: "iam",
					awsAccessKeyId: "AKIAIOSFODNN7EXAMPLE",
					awsSecretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
					awsRegion: "us-west-2",
					bedrockApiKey: undefined,
				})
			);
		});

		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it("should trim whitespace from AWS credentials before saving", async () => {
		const onOpenChange = vi.fn();
		render(<SettingsDialog open={true} onOpenChange={onOpenChange} />);

		const providerSelect = screen.getByLabelText("Provider");
		fireEvent.change(providerSelect, { target: { value: "bedrock" } });

		const awsAccessKeyInput = screen.getByLabelText("AWS Access Key ID");
		const awsSecretKeyInput = screen.getByLabelText("AWS Secret Access Key");
		const awsRegionInput = screen.getByLabelText("AWS Region");
		const saveButton = screen.getByRole("button", { name: "Save" });

		fireEvent.change(awsAccessKeyInput, { target: { value: "  AKIATEST  " } });
		fireEvent.change(awsSecretKeyInput, { target: { value: "  secretkey  " } });
		fireEvent.change(awsRegionInput, { target: { value: "  us-east-1  " } });
		fireEvent.click(saveButton);

		await waitFor(() => {
			expect(settings.saveSettings).toHaveBeenCalledWith(
				expect.objectContaining({
					provider: "bedrock",
					apiKey: undefined,
					bedrockAuthMethod: "iam",
					awsAccessKeyId: "AKIATEST",
					awsSecretAccessKey: "secretkey",
					awsRegion: "us-east-1",
					bedrockApiKey: undefined,
				})
			);
		});
	});

	it("should load Google provider settings correctly", () => {
		vi.mocked(settings.getSettings).mockReturnValue({
			provider: "google",
			apiKey: "google-api-key-123",
			googleModel: "gemini-2.0-flash",
		});

		render(<SettingsDialog open={true} onOpenChange={() => {}} />);

		const providerSelect = screen.getByLabelText("Provider") as HTMLSelectElement;
		const apiKeyInput = screen.getByLabelText("API Key") as HTMLInputElement;
		const modelInput = screen.getByLabelText("Model (Optional)") as HTMLInputElement;

		expect(providerSelect.value).toBe("google");
		expect(apiKeyInput.value).toBe("google-api-key-123");
		expect(modelInput.value).toBe("gemini-2.0-flash");
	});

	it("should show server credential banner when Bedrock is selected and server credentials are configured", () => {
		vi.mocked(settings.getSettings).mockReturnValue({
			provider: "bedrock",
		});
		vi.mocked(settings.getServerCredentialStatus).mockReturnValue({ bedrockConfigured: true });

		render(<SettingsDialog open={true} onOpenChange={() => {}} />);

		expect(
			screen.getByText("Server-provided Bedrock credentials are active. Entering your own is optional."),
		).toBeInTheDocument();
	});

	it("should not show server credential banner when Bedrock is selected but server credentials are not configured", () => {
		vi.mocked(settings.getSettings).mockReturnValue({
			provider: "bedrock",
		});
		vi.mocked(settings.getServerCredentialStatus).mockReturnValue({ bedrockConfigured: false });

		render(<SettingsDialog open={true} onOpenChange={() => {}} />);

		expect(
			screen.queryByText("Server-provided Bedrock credentials are active. Entering your own is optional."),
		).not.toBeInTheDocument();
	});

	it("should not show server credential banner for non-Bedrock providers even when server credentials are configured", () => {
		vi.mocked(settings.getSettings).mockReturnValue({
			provider: "anthropic",
			apiKey: "",
		});
		vi.mocked(settings.getServerCredentialStatus).mockReturnValue({ bedrockConfigured: true });

		render(<SettingsDialog open={true} onOpenChange={() => {}} />);

		expect(
			screen.queryByText("Server-provided Bedrock credentials are active. Entering your own is optional."),
		).not.toBeInTheDocument();
	});

	it("should keep credential input fields visible when server credentials are active", () => {
		vi.mocked(settings.getSettings).mockReturnValue({
			provider: "bedrock",
		});
		vi.mocked(settings.getServerCredentialStatus).mockReturnValue({ bedrockConfigured: true });

		render(<SettingsDialog open={true} onOpenChange={() => {}} />);

		// Banner should be visible
		expect(
			screen.getByText("Server-provided Bedrock credentials are active. Entering your own is optional."),
		).toBeInTheDocument();

		// Credential fields should still be visible
		expect(screen.getByLabelText("Authentication Method")).toBeInTheDocument();
		expect(screen.getByLabelText("AWS Access Key ID")).toBeInTheDocument();
		expect(screen.getByLabelText("AWS Secret Access Key")).toBeInTheDocument();
		expect(screen.getByLabelText("AWS Region")).toBeInTheDocument();
	});

	it("should not show server credential banner when server credential status is null", () => {
		vi.mocked(settings.getSettings).mockReturnValue({
			provider: "bedrock",
		});
		vi.mocked(settings.getServerCredentialStatus).mockReturnValue(null);

		render(<SettingsDialog open={true} onOpenChange={() => {}} />);

		expect(
			screen.queryByText("Server-provided Bedrock credentials are active. Entering your own is optional."),
		).not.toBeInTheDocument();
	});
});
