import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { getSettings, saveSettings, hasApiKey, type LLMSettings } from "../settings";

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
				model: "gpt-4",
			};

			store["form-editor-llm-settings"] = JSON.stringify(savedSettings);

			const settings = getSettings();
			expect(settings).toEqual(savedSettings);
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
			expect(settings).toEqual({
				provider: "anthropic",
				apiKey: undefined,
			});
		});

		it("should filter out invalid model types", () => {
			store["form-editor-llm-settings"] = JSON.stringify({ provider: "anthropic", model: true });

			const settings = getSettings();
			expect(settings).toEqual({
				provider: "anthropic",
				model: undefined,
			});
		});

		it("should handle settings with only provider", () => {
			store["form-editor-llm-settings"] = JSON.stringify({ provider: "openai" });

			const settings = getSettings();
			expect(settings).toEqual({
				provider: "openai",
				apiKey: undefined,
				model: undefined,
			});
		});
	});

	describe("saveSettings", () => {
		it("should save settings to localStorage", () => {
			const settings: LLMSettings = {
				provider: "anthropic",
				apiKey: "test-key",
				model: "claude-3",
			};

			saveSettings(settings);

			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				"form-editor-llm-settings",
				JSON.stringify(settings)
			);
			expect(store["form-editor-llm-settings"]).toBe(JSON.stringify(settings));
		});

		it("should save settings with only provider", () => {
			const settings: LLMSettings = {
				provider: "openai",
			};

			saveSettings(settings);

			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				"form-editor-llm-settings",
				JSON.stringify(settings)
			);
			expect(store["form-editor-llm-settings"]).toBe(JSON.stringify(settings));
		});

		it("should overwrite existing settings", () => {
			const oldSettings: LLMSettings = {
				provider: "anthropic",
				apiKey: "old-key",
			};

			const newSettings: LLMSettings = {
				provider: "openai",
				apiKey: "new-key",
				model: "gpt-4",
			};

			saveSettings(oldSettings);
			saveSettings(newSettings);

			expect(store["form-editor-llm-settings"]).toBe(JSON.stringify(newSettings));
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
				model: "claude-3-opus",
			};

			saveSettings(original);
			const loaded = getSettings();

			expect(loaded).toEqual(original);
		});

		it("should preserve settings without optional fields", () => {
			const original: LLMSettings = {
				provider: "openai",
			};

			saveSettings(original);
			const loaded = getSettings();

			expect(loaded.provider).toBe(original.provider);
			expect(loaded.apiKey).toBeUndefined();
			expect(loaded.model).toBeUndefined();
		});
	});
});
