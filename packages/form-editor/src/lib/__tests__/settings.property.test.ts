/**
 * Property-Based Tests for Settings Storage
 * 
 * Feature: llm-integration, Property 7: Settings Round-Trip
 * Validates: Requirements 6.4
 * 
 * Tests that LLM settings can be saved to localStorage and loaded back
 * without data loss or corruption across all valid settings configurations.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import * as fc from "fast-check";
import { getSettings, saveSettings, type LLMSettings, type LLMProvider } from "../settings";

// Configure fast-check
fc.configureGlobal({
  numRuns: 100,
});

describe("Settings Storage - Property-Based Tests", () => {
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

  describe("Property 7: Settings Round-Trip", () => {
    /**
     * **Validates: Requirements 6.4**
     * 
     * For any valid LLMSettings object, saving to localStorage and then
     * loading SHALL produce an equivalent settings object.
     */

    // Generator for valid LLM providers
    const providerArb = fc.constantFrom<LLMProvider>("anthropic", "openai", "google", "bedrock");

    // Generator for non-empty strings (for API keys, models, etc.)
    const nonEmptyStringArb = fc.string({ minLength: 1, maxLength: 100 });

    // Generator for complete LLMSettings objects matching the new per-provider model schema
    const settingsArb: fc.Arbitrary<LLMSettings> = fc.record({
      provider: providerArb,
      apiKey: fc.option(nonEmptyStringArb, { nil: undefined }),
      anthropicModel: fc.option(nonEmptyStringArb, { nil: undefined }),
      openaiModel: fc.option(nonEmptyStringArb, { nil: undefined }),
      googleModel: fc.option(nonEmptyStringArb, { nil: undefined }),
      bedrockModel: fc.option(nonEmptyStringArb, { nil: undefined }),
      bedrockAuthMethod: fc.option(fc.constantFrom<"iam" | "apiKey">("iam", "apiKey"), { nil: undefined }),
      awsAccessKeyId: fc.option(nonEmptyStringArb, { nil: undefined }),
      awsSecretAccessKey: fc.option(nonEmptyStringArb, { nil: undefined }),
      awsRegion: fc.option(nonEmptyStringArb, { nil: undefined }),
      bedrockApiKey: fc.option(nonEmptyStringArb, { nil: undefined }),
    });

    /**
     * Helper: compare two LLMSettings by checking each field individually.
     * JSON.stringify drops undefined values, so we compare field-by-field.
     */
    function assertSettingsEqual(loaded: LLMSettings, original: LLMSettings) {
      expect(loaded.provider).toBe(original.provider);
      expect(loaded.apiKey).toBe(original.apiKey);
      expect(loaded.anthropicModel).toBe(original.anthropicModel);
      expect(loaded.openaiModel).toBe(original.openaiModel);
      expect(loaded.googleModel).toBe(original.googleModel);
      expect(loaded.bedrockModel).toBe(original.bedrockModel);
      expect(loaded.bedrockAuthMethod).toBe(original.bedrockAuthMethod);
      expect(loaded.awsAccessKeyId).toBe(original.awsAccessKeyId);
      expect(loaded.awsSecretAccessKey).toBe(original.awsSecretAccessKey);
      expect(loaded.awsRegion).toBe(original.awsRegion);
      expect(loaded.bedrockApiKey).toBe(original.bedrockApiKey);
    }

    it("should preserve all settings fields through save and load", () => {
      fc.assert(
        fc.property(
          settingsArb,
          (originalSettings) => {
            saveSettings(originalSettings);
            const loadedSettings = getSettings();
            assertSettingsEqual(loadedSettings, originalSettings);
          }
        )
      );
    });

    it("should preserve provider field for all valid providers", () => {
      fc.assert(
        fc.property(
          providerArb,
          (provider) => {
            const settings: LLMSettings = { provider };
            
            saveSettings(settings);
            const loaded = getSettings();
            
            expect(loaded.provider).toBe(provider);
          }
        )
      );
    });

    it("should preserve apiKey when present", () => {
      fc.assert(
        fc.property(
          providerArb,
          nonEmptyStringArb,
          (provider, apiKey) => {
            const settings: LLMSettings = { provider, apiKey };
            
            saveSettings(settings);
            const loaded = getSettings();
            
            expect(loaded.apiKey).toBe(apiKey);
          }
        )
      );
    });

    it("should preserve per-provider model when present", () => {
      fc.assert(
        fc.property(
          nonEmptyStringArb,
          (model) => {
            // Test anthropicModel
            const settings: LLMSettings = { provider: "anthropic", anthropicModel: model };
            saveSettings(settings);
            const loaded = getSettings();
            expect(loaded.anthropicModel).toBe(model);
          }
        )
      );
    });

    it("should preserve undefined apiKey", () => {
      fc.assert(
        fc.property(
          providerArb,
          (provider) => {
            const settings: LLMSettings = { provider, apiKey: undefined };
            
            saveSettings(settings);
            const loaded = getSettings();
            
            expect(loaded.apiKey).toBeUndefined();
          }
        )
      );
    });

    it("should handle multiple save/load cycles without data loss", () => {
      fc.assert(
        fc.property(
          fc.array(settingsArb, { minLength: 1, maxLength: 10 }),
          (settingsArray) => {
            for (const settings of settingsArray) {
              saveSettings(settings);
              const loaded = getSettings();
              assertSettingsEqual(loaded, settings);
            }
          }
        )
      );
    });

    it("should preserve settings with all fields populated", () => {
      fc.assert(
        fc.property(
          settingsArb,
          (settings) => {
            saveSettings(settings);
            const loaded = getSettings();
            assertSettingsEqual(loaded, settings);
          }
        )
      );
    });

    it("should preserve settings with only provider field", () => {
      fc.assert(
        fc.property(
          providerArb,
          (provider) => {
            const settings: LLMSettings = { provider };
            
            saveSettings(settings);
            const loaded = getSettings();
            
            expect(loaded.provider).toBe(provider);
            expect(loaded.apiKey).toBeUndefined();
          }
        )
      );
    });

    it("should overwrite previous settings correctly", () => {
      fc.assert(
        fc.property(
          settingsArb,
          settingsArb,
          (firstSettings, secondSettings) => {
            // Save first settings
            saveSettings(firstSettings);
            
            // Save second settings (overwrite)
            saveSettings(secondSettings);
            const secondLoaded = getSettings();
            assertSettingsEqual(secondLoaded, secondSettings);
          }
        )
      );
    });

    it("should handle settings with unicode and special characters", () => {
      fc.assert(
        fc.property(
          providerArb,
          fc.string({ minLength: 1, maxLength: 50 }),
          (provider, apiKey) => {
            const settings: LLMSettings = { provider, apiKey };
            
            saveSettings(settings);
            const loaded = getSettings();
            
            expect(loaded.apiKey).toBe(apiKey);
          }
        )
      );
    });

    it("should maintain type consistency through round-trip", () => {
      fc.assert(
        fc.property(
          settingsArb,
          (settings) => {
            saveSettings(settings);
            const loaded = getSettings();
            
            // Check types are preserved
            expect(typeof loaded.provider).toBe("string");
            expect(["anthropic", "openai", "google", "bedrock"]).toContain(loaded.provider);
            
            if (settings.apiKey !== undefined) {
              expect(typeof loaded.apiKey).toBe("string");
            } else {
              expect(loaded.apiKey).toBeUndefined();
            }
          }
        )
      );
    });

    it("should handle rapid successive saves", () => {
      fc.assert(
        fc.property(
          fc.array(settingsArb, { minLength: 5, maxLength: 20 }),
          (settingsArray) => {
            // Rapidly save multiple settings
            for (const settings of settingsArray) {
              saveSettings(settings);
            }
            
            // The last one should be loaded
            const loaded = getSettings();
            const lastSettings = settingsArray[settingsArray.length - 1];
            assertSettingsEqual(loaded, lastSettings);
          }
        )
      );
    });

    it("should be idempotent - multiple loads return same result", () => {
      fc.assert(
        fc.property(
          settingsArb,
          fc.integer({ min: 2, max: 10 }),
          (settings, numLoads) => {
            saveSettings(settings);
            
            // Load multiple times
            const firstLoad = getSettings();
            for (let i = 1; i < numLoads; i++) {
              const subsequentLoad = getSettings();
              assertSettingsEqual(subsequentLoad, firstLoad);
            }
          }
        )
      );
    });
  });
});
