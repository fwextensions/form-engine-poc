/**
 * Settings storage for LLM configuration.
 * Manages API keys and provider settings in localStorage.
 */

const SETTINGS_KEY = "form-editor-llm-settings";

export type LLMProvider = "anthropic" | "openai" | "google" | "bedrock";

export type BedrockAuthMethod = "iam" | "apiKey";

export interface LLMSettings {
	provider: LLMProvider;
	apiKey?: string;
	// Provider-specific models
	anthropicModel?: string;
	openaiModel?: string;
	googleModel?: string;
	bedrockModel?: string;
	// AWS Bedrock specific credentials
	bedrockAuthMethod?: BedrockAuthMethod;
	awsAccessKeyId?: string;
	awsSecretAccessKey?: string;
	awsRegion?: string;
	bedrockApiKey?: string;
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
 * Gets the model for the current provider.
 * Returns the provider-specific model or the default if not set.
 */
export function getModelForProvider(settings: LLMSettings): string {
	switch (settings.provider) {
		case "anthropic":
			return settings.anthropicModel || DEFAULT_MODELS.anthropic;
		case "openai":
			return settings.openaiModel || DEFAULT_MODELS.openai;
		case "google":
			return settings.googleModel || DEFAULT_MODELS.google;
		case "bedrock":
			return settings.bedrockModel || DEFAULT_MODELS.bedrock;
		default:
			return DEFAULT_MODELS[settings.provider];
	}
}

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
			anthropicModel: typeof parsed.anthropicModel === "string" ? parsed.anthropicModel : undefined,
			openaiModel: typeof parsed.openaiModel === "string" ? parsed.openaiModel : undefined,
			googleModel: typeof parsed.googleModel === "string" ? parsed.googleModel : undefined,
			bedrockModel: typeof parsed.bedrockModel === "string" ? parsed.bedrockModel : undefined,
			bedrockAuthMethod: parsed.bedrockAuthMethod === "iam" || parsed.bedrockAuthMethod === "apiKey"
				? parsed.bedrockAuthMethod
				: undefined,
			awsAccessKeyId: typeof parsed.awsAccessKeyId === "string" ? parsed.awsAccessKeyId : undefined,
			awsSecretAccessKey: typeof parsed.awsSecretAccessKey === "string" ? parsed.awsSecretAccessKey : undefined,
			awsRegion: typeof parsed.awsRegion === "string" ? parsed.awsRegion : undefined,
			bedrockApiKey: typeof parsed.bedrockApiKey === "string" ? parsed.bedrockApiKey : undefined,
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
			anthropicModel: settings.anthropicModel,
			openaiModel: settings.openaiModel,
			googleModel: settings.googleModel,
			bedrockModel: settings.bedrockModel,
			bedrockAuthMethod: settings.bedrockAuthMethod,
			awsAccessKeyId: settings.awsAccessKeyId,
			awsSecretAccessKey: settings.awsSecretAccessKey,
			awsRegion: settings.awsRegion,
			bedrockApiKey: settings.bedrockApiKey,
		};

		window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(toStore));
	} catch (error) {
		// Handle storage quota exceeded or other errors
		console.error("Failed to save LLM settings to localStorage:", error);
		throw new Error("Failed to save settings. Storage may be full.");
	}
}

// Cache the server credential status
let serverCredentialStatus: { bedrockConfigured: boolean } | null = null;

/**
 * Fetches the server credential status from the GET /api/llm/credentials endpoint.
 * Caches the result so subsequent calls return the cached value without a network request.
 */
export async function fetchServerCredentialStatus(): Promise<{ bedrockConfigured: boolean }> {
	if (serverCredentialStatus !== null) {
		return serverCredentialStatus;
	}
	try {
		const response = await fetch("/api/llm/credentials");
		const data = await response.json();
		serverCredentialStatus = data;
		return data;
	} catch {
		return { bedrockConfigured: false };
	}
}

/**
 * Sets the cached server credential status.
 * Useful for updating the cache after receiving status from the server.
 */
export function setServerCredentialStatus(status: { bedrockConfigured: boolean }): void {
	serverCredentialStatus = status;
}

/**
 * Gets the cached server credential status.
 * Returns null if the status has not been fetched yet.
 */
export function getServerCredentialStatus(): { bedrockConfigured: boolean } | null {
	return serverCredentialStatus;
}

/**
 * Checks if credentials are configured for the current provider.
 * Returns true if the necessary credentials exist in settings.
 * For the bedrock provider, also returns true when server-side credentials are available.
 */
export function hasApiKey(): boolean {
	const settings = getSettings();
	
	// Check provider-specific credentials
	switch (settings.provider) {
		case "bedrock": {
			// If server-side Bedrock credentials are available, no client credentials needed
			const serverStatus = getServerCredentialStatus();
			if (serverStatus?.bedrockConfigured) {
				return true;
			}

			// Bedrock requires either AWS credentials or API key
			const authMethod = settings.bedrockAuthMethod || "iam";
			if (authMethod === "apiKey") {
				return !!(
					settings.bedrockApiKey &&
					settings.bedrockApiKey.length > 0 &&
					settings.awsRegion &&
					settings.awsRegion.length > 0
				);
			} else {
				return !!(
					settings.awsAccessKeyId &&
					settings.awsAccessKeyId.length > 0 &&
					settings.awsSecretAccessKey &&
					settings.awsSecretAccessKey.length > 0 &&
					settings.awsRegion &&
					settings.awsRegion.length > 0
				);
			}
		}
		case "anthropic":
		case "openai":
		case "google":
			// Other providers require API key
			return typeof settings.apiKey === "string" && settings.apiKey.length > 0;
		default:
			return false;
	}
}
