import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { getSettings, saveSettings, hasApiKey, DEFAULT_MODELS, type LLMSettings } from "../settings";

describe("settings", () => {
	// Mock localStorage
	let store: Record<string, string> = {};

	const localStorageMock = {
		getItem: vi.fn((key: string) => store[key] || null),
		setItem: vi.fn((key: string, value: string) => {
			store[key] = value;
		}),
		removeItem: vi.fn((key: string) => {
			delete store[key];
		}),
		clear: vi.fn(() => {
			store = {};
		}),
	};

	beforeEach(() => {
		// Reset store and clear mock call history
		store = {};
		vi.clearAllMocks();
		
		// Mock window.localStorage using vi.stubGlobal
		vi.stubGlobal("window", {
			localStorage: localStorageMock,
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	describe("DEFAULT_MODELS", () => {
		it("should have default model for anthropic", () => {
			expect(DEFAULT_MODELS.anthropic).toBe("claude-sonnet-4-20250514");
		});

		it("should have default model for openai", () => {
			expect(DEFAULT_MODELS.openai).toBe("gpt-4o");
		});

		it("should have default model for google", () => {
			expect(DEFAULT_MODELS.google).toBe("gemini-2.0-flash");
		});

		it("should have default model for bedrock", () => {
			expect(DEFAULT_MODELS.bedrock).toBe("anthropic.claude-3-sonnet-20240229-v1:0");
		});

		it("should have all four providers defined", () => {
			const providers = Object.keys(DEFAULT_MODELS);
			expect(providers).toHaveLength(4);
			expect(providers).toContain("anthropic");
			expect(providers).toContain("openai");
			expect(providers).toContain("google");
			expect(providers).toContain("bedrock");
		});
	});

	describe("getSettings", () => {
		it("should return default settings when localStorage is empty", () => {
			const settings = getSettings();
			expect(settings).toEqual({
				provider: "anthropic",
			});
		});

		it("should return saved settings from localStorage", () => {
			const savedSettings: LLMSettings = {
				provider: "openai",
				apiKey: "test-key-123",
				openaiModel: "gpt-4",
			};

			store["form-editor-llm-settings"] = JSON.stringify(savedSettings);

			const settings = getSettings();
			expect(settings.provider).toBe("openai");
			expect(settings.apiKey).toBe("test-key-123");
			expect(settings.openaiModel).toBe("gpt-4");
		});

		it("should return saved settings for google provider", () => {
			const savedSettings: LLMSettings = {
				provider: "google",
				apiKey: "test-google-key",
				googleModel: "gemini-pro",
			};

			store["form-editor-llm-settings"] = JSON.stringify(savedSettings);

			const settings = getSettings();
			expect(settings.provider).toBe("google");
			expect(settings.apiKey).toBe("test-google-key");
			expect(settings.googleModel).toBe("gemini-pro");
		});

		it("should return saved settings for bedrock provider", () => {
			const savedSettings: LLMSettings = {
				provider: "bedrock",
				apiKey: "test-bedrock-key",
				bedrockModel: "anthropic.claude-v2",
			};

			store["form-editor-llm-settings"] = JSON.stringify(savedSettings);

			const settings = getSettings();
			expect(settings.provider).toBe("bedrock");
			expect(settings.apiKey).toBe("test-bedrock-key");
			expect(settings.bedrockModel).toBe("anthropic.claude-v2");
		});

		it("should return saved settings with AWS credentials for bedrock", () => {
			const savedSettings: LLMSettings = {
				provider: "bedrock",
				awsAccessKeyId: "AKIAIOSFODNN7EXAMPLE",
				awsSecretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
				awsRegion: "us-east-1",
				bedrockModel: "anthropic.claude-v2",
			};

			store["form-editor-llm-settings"] = JSON.stringify(savedSettings);

			const settings = getSettings();
			expect(settings.provider).toBe("bedrock");
			expect(settings.awsAccessKeyId).toBe("AKIAIOSFODNN7EXAMPLE");
			expect(settings.awsSecretAccessKey).toBe("wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY");
			expect(settings.awsRegion).toBe("us-east-1");
			expect(settings.bedrockModel).toBe("anthropic.claude-v2");
		});

		it("should filter out invalid awsAccessKeyId types", () => {
			store["form-editor-llm-settings"] = JSON.stringify({ 
				provider: "bedrock", 
				awsAccessKeyId: 123 
			});

			const settings = getSettings();
			expect(settings.provider).toBe("bedrock");
			expect(settings.awsAccessKeyId).toBeUndefined();
		});

		it("should filter out invalid awsSecretAccessKey types", () => {
			store["form-editor-llm-settings"] = JSON.stringify({ 
				provider: "bedrock", 
				awsSecretAccessKey: true 
			});

			const settings = getSettings();
			expect(settings.provider).toBe("bedrock");
			expect(settings.awsSecretAccessKey).toBeUndefined();
		});

		it("should filter out invalid awsRegion types", () => {
			store["form-editor-llm-settings"] = JSON.stringify({ 
				provider: "bedrock", 
				awsRegion: 456 
			});

			const settings = getSettings();
			expect(settings.provider).toBe("bedrock");
			expect(settings.awsRegion).toBeUndefined();
		});

		it("should return default settings when localStorage contains invalid JSON", () => {
			store["form-editor-llm-settings"] = "invalid json {";

			const settings = getSettings();
			expect(settings).toEqual({
				provider: "anthropic",
			});
		});

		it("should return default settings when localStorage contains non-object", () => {
			store["form-editor-llm-settings"] = JSON.stringify("string");

			const settings = getSettings();
			expect(settings).toEqual({
				provider: "anthropic",
			});
		});

		it("should return default settings when provider is invalid", () => {
			store["form-editor-llm-settings"] = JSON.stringify({ provider: "invalid-provider" });

			const settings = getSettings();
			expect(settings).toEqual({
				provider: "anthropic",
			});
		});

		it("should filter out invalid apiKey types", () => {
			store["form-editor-llm-settings"] = JSON.stringify({ provider: "anthropic", apiKey: 123 });

			const settings = getSettings();
			expect(settings.provider).toBe("anthropic");
			expect(settings.apiKey).toBeUndefined();
		});

		it("should handle settings with only provider", () => {
			store["form-editor-llm-settings"] = JSON.stringify({ provider: "openai" });

			const settings = getSettings();
			expect(settings.provider).toBe("openai");
			expect(settings.apiKey).toBeUndefined();
		});
	});

	describe("saveSettings", () => {
		it("should save settings to localStorage", () => {
			const settings: LLMSettings = {
				provider: "anthropic",
				apiKey: "test-key",
			};

			saveSettings(settings);

			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				"form-editor-llm-settings",
				expect.any(String)
			);
			const stored = JSON.parse(store["form-editor-llm-settings"]);
			expect(stored.provider).toBe("anthropic");
			expect(stored.apiKey).toBe("test-key");
		});

		it("should save settings with only provider", () => {
			const settings: LLMSettings = {
				provider: "openai",
			};

			saveSettings(settings);

			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				"form-editor-llm-settings",
				expect.any(String)
			);
			const stored = JSON.parse(store["form-editor-llm-settings"]);
			expect(stored.provider).toBe("openai");
		});

		it("should save settings with AWS credentials for bedrock", () => {
			const settings: LLMSettings = {
				provider: "bedrock",
				awsAccessKeyId: "AKIAIOSFODNN7EXAMPLE",
				awsSecretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
				awsRegion: "us-west-2",
				bedrockModel: "anthropic.claude-v2",
			};

			saveSettings(settings);

			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				"form-editor-llm-settings",
				expect.any(String)
			);
			
			// Verify the stored value can be parsed back correctly
			const stored = JSON.parse(store["form-editor-llm-settings"]);
			expect(stored.provider).toBe("bedrock");
			expect(stored.awsAccessKeyId).toBe("AKIAIOSFODNN7EXAMPLE");
			expect(stored.awsSecretAccessKey).toBe("wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY");
			expect(stored.awsRegion).toBe("us-west-2");
			expect(stored.bedrockModel).toBe("anthropic.claude-v2");
		});

		it("should overwrite existing settings", () => {
			const oldSettings: LLMSettings = {
				provider: "anthropic",
				apiKey: "old-key",
			};

			const newSettings: LLMSettings = {
				provider: "openai",
				apiKey: "new-key",
				openaiModel: "gpt-4",
			};

			saveSettings(oldSettings);
			saveSettings(newSettings);

			const stored = JSON.parse(store["form-editor-llm-settings"]);
			expect(stored.provider).toBe("openai");
			expect(stored.apiKey).toBe("new-key");
			expect(stored.openaiModel).toBe("gpt-4");
		});

		it("should throw error when localStorage.setItem fails", () => {
			// Mock setItem to throw an error
			localStorageMock.setItem.mockImplementationOnce(() => {
				throw new Error("QuotaExceededError");
			});

			const settings: LLMSettings = {
				provider: "anthropic",
				apiKey: "test-key",
			};

			expect(() => saveSettings(settings)).toThrow(
				"Failed to save settings. Storage may be full."
			);
		});
	});

	describe("hasApiKey", () => {
		it("should return false when no settings are saved", () => {
			expect(hasApiKey()).toBe(false);
		});

		it("should return false when apiKey is undefined", () => {
			saveSettings({ provider: "anthropic" });
			expect(hasApiKey()).toBe(false);
		});

		it("should return false when apiKey is empty string", () => {
			saveSettings({ provider: "anthropic", apiKey: "" });
			expect(hasApiKey()).toBe(false);
		});

		it("should return true when apiKey is non-empty string", () => {
			saveSettings({ provider: "anthropic", apiKey: "test-key" });
			expect(hasApiKey()).toBe(true);
		});

		it("should return true for any non-empty apiKey", () => {
			saveSettings({ provider: "openai", apiKey: "sk-123456" });
			expect(hasApiKey()).toBe(true);
		});
	});

	describe("round-trip", () => {
		it("should preserve settings through save and load", () => {
			const original: LLMSettings = {
				provider: "anthropic",
				apiKey: "test-api-key-123",
				anthropicModel: "claude-3-opus",
			};

			saveSettings(original);
			const loaded = getSettings();

			expect(loaded.provider).toBe(original.provider);
			expect(loaded.apiKey).toBe(original.apiKey);
			expect(loaded.anthropicModel).toBe(original.anthropicModel);
		});

		it("should preserve settings without optional fields", () => {
			const original: LLMSettings = {
				provider: "openai",
			};

			saveSettings(original);
			const loaded = getSettings();

			expect(loaded.provider).toBe(original.provider);
			expect(loaded.apiKey).toBeUndefined();
		});

		it("should preserve AWS credentials through save and load", () => {
			const original: LLMSettings = {
				provider: "bedrock",
				awsAccessKeyId: "AKIAIOSFODNN7EXAMPLE",
				awsSecretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
				awsRegion: "eu-west-1",
				bedrockModel: "anthropic.claude-3-sonnet-20240229-v1:0",
			};

			saveSettings(original);
			const loaded = getSettings();

			expect(loaded.provider).toBe(original.provider);
			expect(loaded.awsAccessKeyId).toBe(original.awsAccessKeyId);
			expect(loaded.awsSecretAccessKey).toBe(original.awsSecretAccessKey);
			expect(loaded.awsRegion).toBe(original.awsRegion);
			expect(loaded.bedrockModel).toBe(original.bedrockModel);
		});
	});
});
