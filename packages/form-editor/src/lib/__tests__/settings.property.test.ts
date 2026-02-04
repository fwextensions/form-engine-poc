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

// Helper function for deep equality check
function deepEqual(a: any, b: any): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

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
    const providerArb = fc.constantFrom<LLMProvider>("anthropic", "openai");

    // Generator for API keys (non-empty strings)
    const apiKeyArb = fc.string({ minLength: 1, maxLength: 100 });

    // Generator for model names
    const modelArb = fc.string({ minLength: 1, maxLength: 50 });

    // Generator for complete LLMSettings objects
    const settingsArb = fc.record({
      provider: providerArb,
      apiKey: fc.option(apiKeyArb, { nil: undefined }),
      model: fc.option(modelArb, { nil: undefined }),
    });

    it("should preserve all settings fields through save and load", () => {
      fc.assert(
        fc.property(
          settingsArb,
          (originalSettings) => {
            // Save the settings
            saveSettings(originalSettings);
            
            // Load them back
            const loadedSettings = getSettings();
            
            // Should be equivalent
            expect(loadedSettings).toEqual(originalSettings);
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
          apiKeyArb,
          (provider, apiKey) => {
            const settings: LLMSettings = { provider, apiKey };
            
            saveSettings(settings);
            const loaded = getSettings();
            
            expect(loaded.apiKey).toBe(apiKey);
          }
        )
      );
    });

    it("should preserve model when present", () => {
      fc.assert(
        fc.property(
          providerArb,
          modelArb,
          (provider, model) => {
            const settings: LLMSettings = { provider, model };
            
            saveSettings(settings);
            const loaded = getSettings();
            
            expect(loaded.model).toBe(model);
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

    it("should preserve undefined model", () => {
      fc.assert(
        fc.property(
          providerArb,
          (provider) => {
            const settings: LLMSettings = { provider, model: undefined };
            
            saveSettings(settings);
            const loaded = getSettings();
            
            expect(loaded.model).toBeUndefined();
          }
        )
      );
    });

    it("should handle multiple save/load cycles without data loss", () => {
      fc.assert(
        fc.property(
          fc.array(settingsArb, { minLength: 1, maxLength: 10 }),
          (settingsArray) => {
            let lastSettings: LLMSettings | null = null;
            
            // Perform multiple save/load cycles
            for (const settings of settingsArray) {
              saveSettings(settings);
              const loaded = getSettings();
              expect(loaded).toEqual(settings);
              lastSettings = loaded;
            }
            
            // Final load should match the last saved settings
            const finalLoaded = getSettings();
            expect(finalLoaded).toEqual(lastSettings);
          }
        )
      );
    });

    it("should preserve settings with all fields populated", () => {
      fc.assert(
        fc.property(
          providerArb,
          apiKeyArb,
          modelArb,
          (provider, apiKey, model) => {
            const settings: LLMSettings = { provider, apiKey, model };
            
            saveSettings(settings);
            const loaded = getSettings();
            
            expect(loaded).toEqual(settings);
            expect(loaded.provider).toBe(provider);
            expect(loaded.apiKey).toBe(apiKey);
            expect(loaded.model).toBe(model);
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
            expect(loaded.model).toBeUndefined();
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
            // Skip test if both settings are identical
            fc.pre(!deepEqual(firstSettings, secondSettings));
            
            // Save first settings
            saveSettings(firstSettings);
            const firstLoaded = getSettings();
            expect(firstLoaded).toEqual(firstSettings);
            
            // Save second settings (overwrite)
            saveSettings(secondSettings);
            const secondLoaded = getSettings();
            expect(secondLoaded).toEqual(secondSettings);
            
            // Should not contain any data from first settings
            expect(secondLoaded).not.toEqual(firstSettings);
          }
        ),
        { 
          examples: [],
          // Skip when settings are identical
          skipEqualValues: true,
        }
      );
    });

    it("should handle settings with special characters in strings", () => {
      fc.assert(
        fc.property(
          providerArb,
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          (provider, apiKey, model) => {
            const settings: LLMSettings = { provider, apiKey, model };
            
            saveSettings(settings);
            const loaded = getSettings();
            
            expect(loaded).toEqual(settings);
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
            expect(["anthropic", "openai"]).toContain(loaded.provider);
            
            if (settings.apiKey !== undefined) {
              expect(typeof loaded.apiKey).toBe("string");
            } else {
              expect(loaded.apiKey).toBeUndefined();
            }
            
            if (settings.model !== undefined) {
              expect(typeof loaded.model).toBe("string");
            } else {
              expect(loaded.model).toBeUndefined();
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
            expect(loaded).toEqual(lastSettings);
          }
        )
      );
    });

    it("should preserve empty string values correctly", () => {
      fc.assert(
        fc.property(
          providerArb,
          (provider) => {
            // Note: empty strings are valid but hasApiKey() should return false
            const settings: LLMSettings = { provider, apiKey: "", model: "" };
            
            saveSettings(settings);
            const loaded = getSettings();
            
            // Empty strings should be preserved as-is
            expect(loaded.apiKey).toBe("");
            expect(loaded.model).toBe("");
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
            const loads: LLMSettings[] = [];
            for (let i = 0; i < numLoads; i++) {
              loads.push(getSettings());
            }
            
            // All loads should be identical
            for (const loaded of loads) {
              expect(loaded).toEqual(settings);
            }
            
            // All loads should be equal to each other
            for (let i = 1; i < loads.length; i++) {
              expect(loads[i]).toEqual(loads[0]);
            }
          }
        )
      );
    });
  });
});
