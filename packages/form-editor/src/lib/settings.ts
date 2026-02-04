/**
 * Settings storage for LLM configuration.
 * Manages API keys and provider settings in localStorage.
 */

const SETTINGS_KEY = "form-editor-llm-settings";

export type LLMProvider = "anthropic" | "openai" | "google" | "bedrock";

export interface LLMSettings {
	provider: LLMProvider;
	apiKey?: string;
	model?: string;
	// AWS Bedrock specific credentials
	awsAccessKeyId?: string;
	awsSecretAccessKey?: string;
	awsRegion?: string;
}

/**
 * Default models for each provider.
 * Used when no model is explicitly specified in settings.
 */
export const DEFAULT_MODELS: Record<LLMProvider, string> = {
	anthropic: "claude-sonnet-4-20250514",
	openai: "gpt-4o",
	google: "gemini-2.0-flash",
	bedrock: "anthropic.claude-3-sonnet-20240229-v1:0",
};

/**
 * Default settings when none are saved or storage is corrupted.
 */
const DEFAULT_SETTINGS: LLMSettings = {
	provider: "anthropic",
};

/**
 * Retrieves LLM settings from localStorage.
 * Returns default settings if storage is missing or corrupted.
 */
export function getSettings(): LLMSettings {
	if (typeof window === "undefined") {
		return DEFAULT_SETTINGS;
	}

	try {
		const stored = window.localStorage.getItem(SETTINGS_KEY);
		if (!stored) {
			return DEFAULT_SETTINGS;
		}

		const parsed = JSON.parse(stored);
		
		// Validate that parsed data has expected structure
		if (typeof parsed !== "object" || parsed === null) {
			return DEFAULT_SETTINGS;
		}

		// Validate provider is valid
		if (
			parsed.provider !== "anthropic" &&
			parsed.provider !== "openai" &&
			parsed.provider !== "google" &&
			parsed.provider !== "bedrock"
		) {
			return DEFAULT_SETTINGS;
		}

		return {
			provider: parsed.provider,
			apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey : undefined,
			model: typeof parsed.model === "string" ? parsed.model : undefined,
			awsAccessKeyId: typeof parsed.awsAccessKeyId === "string" ? parsed.awsAccessKeyId : undefined,
			awsSecretAccessKey: typeof parsed.awsSecretAccessKey === "string" ? parsed.awsSecretAccessKey : undefined,
			awsRegion: typeof parsed.awsRegion === "string" ? parsed.awsRegion : undefined,
		};
	} catch (error) {
		// Handle JSON parse errors or other exceptions
		console.warn("Failed to load LLM settings from localStorage:", error);
		return DEFAULT_SETTINGS;
	}
}

/**
 * Saves LLM settings to localStorage.
 * Gracefully handles storage errors (e.g., quota exceeded).
 */
export function saveSettings(settings: LLMSettings): void {
	if (typeof window === "undefined") {
		return;
	}

	try {
		const toStore: LLMSettings = {
			provider: settings.provider,
			apiKey: settings.apiKey,
			model: settings.model,
			awsAccessKeyId: settings.awsAccessKeyId,
			awsSecretAccessKey: settings.awsSecretAccessKey,
			awsRegion: settings.awsRegion,
		};

		window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(toStore));
	} catch (error) {
		// Handle storage quota exceeded or other errors
		console.error("Failed to save LLM settings to localStorage:", error);
		throw new Error("Failed to save settings. Storage may be full.");
	}
}

/**
 * Checks if an API key is configured.
 * Returns true if a non-empty API key exists in settings.
 */
export function hasApiKey(): boolean {
	const settings = getSettings();
	return typeof settings.apiKey === "string" && settings.apiKey.length > 0;
}
