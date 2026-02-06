/**
 * Property-Based Tests for YAML Extractor
 * 
 * Feature: llm-integration, Property 8: YAML Extraction from Responses
 * Validates: Requirements 7.1, 7.2, 7.3
 * 
 * Tests that the YAML extractor correctly identifies and extracts YAML content
 * from various response formats, and returns null when no YAML is present.
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { extractYamlFromResponse } from "../yaml-extractor";

// Configure fast-check
fc.configureGlobal({
  numRuns: 100,
});

describe("YAML Extractor - Property-Based Tests", () => {
  describe("Property 8: YAML Extraction from Responses", () => {
    it("should extract YAML from ```yaml code blocks", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => !s.includes("```")),
          fc.string({ minLength: 1 }).filter(s => !s.includes("```") && s.trim().length > 0),
          fc.string({ minLength: 1 }).filter(s => !s.includes("```")),
          (prefix, yamlContent, suffix) => {
            const response = `${prefix}\n\`\`\`yaml\n${yamlContent}\n\`\`\`\n${suffix}`;
            const result = extractYamlFromResponse(response);
            
            // Should extract the YAML content (trimmed)
            expect(result).toBe(yamlContent.trim());
          }
        )
      );
    });

    it("should extract YAML from ```yml code blocks", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => !s.includes("```")),
          fc.string({ minLength: 1 }).filter(s => !s.includes("```") && s.trim().length > 0),
          fc.string({ minLength: 1 }).filter(s => !s.includes("```")),
          (prefix, yamlContent, suffix) => {
            const response = `${prefix}\n\`\`\`yml\n${yamlContent}\n\`\`\`\n${suffix}`;
            const result = extractYamlFromResponse(response);
            
            // Should extract the YAML content (trimmed)
            expect(result).toBe(yamlContent.trim());
          }
        )
      );
    });

    it("should extract YAML from generic ``` blocks when content starts with id:", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => !s.includes("```")),
          fc.string({ minLength: 1 }),
          (prefix, restOfYaml) => {
            const yamlContent = `id: ${restOfYaml}`;
            const response = `${prefix}\n\`\`\`\n${yamlContent}\n\`\`\``;
            const result = extractYamlFromResponse(response);
            
            // Should extract the YAML content (trimmed)
            expect(result).toBe(yamlContent.trim());
          }
        )
      );
    });

    it("should extract YAML from generic ``` blocks when content starts with type:", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => !s.includes("```")),
          fc.string({ minLength: 1 }),
          (prefix, restOfYaml) => {
            const yamlContent = `type: ${restOfYaml}`;
            const response = `${prefix}\n\`\`\`\n${yamlContent}\n\`\`\``;
            const result = extractYamlFromResponse(response);
            
            // Should extract the YAML content (trimmed)
            expect(result).toBe(yamlContent.trim());
          }
        )
      );
    });

    it("should NOT extract non-YAML content from generic ``` blocks", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => 
            !s.includes("```") && 
            !s.trim().startsWith("id:") && 
            !s.trim().startsWith("type:")
          ),
          (nonYamlContent) => {
            const response = `\`\`\`\n${nonYamlContent}\n\`\`\``;
            const result = extractYamlFromResponse(response);
            
            // Should return null for non-YAML content
            expect(result).toBeNull();
          }
        )
      );
    });

    it("should detect raw YAML starting with id:", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          (restOfYaml) => {
            const response = `id: ${restOfYaml}`;
            const result = extractYamlFromResponse(response);
            
            // Should return the entire response (trimmed)
            expect(result).toBe(response.trim());
          }
        )
      );
    });

    it("should detect raw YAML starting with type:", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          (restOfYaml) => {
            const response = `type: ${restOfYaml}`;
            const result = extractYamlFromResponse(response);
            
            // Should return the entire response (trimmed)
            expect(result).toBe(response.trim());
          }
        )
      );
    });

    it("should return null for strings without YAML content", () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => 
            !s.includes("```") && 
            !s.trim().startsWith("id:") && 
            !s.trim().startsWith("type:")
          ),
          (nonYamlString) => {
            const result = extractYamlFromResponse(nonYamlString);
            
            // Should return null when no YAML is found
            expect(result).toBeNull();
          }
        )
      );
    });

    it("should return null for empty or whitespace-only strings", () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(""),
            fc.stringMatching(/^\s+$/)
          ),
          (emptyOrWhitespace) => {
            const result = extractYamlFromResponse(emptyOrWhitespace);
            
            // Should return null for empty/whitespace strings
            expect(result).toBeNull();
          }
        )
      );
    });

    it("should prefer ```yaml blocks over generic ``` blocks", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => !s.includes("```")),
          fc.string({ minLength: 1 }).filter(s => !s.includes("```") && s.trim().length > 0),
          (genericContent, yamlContent) => {
            // Create response with both generic and yaml blocks
            const response = `\`\`\`\nid: ${genericContent}\n\`\`\`\n\n\`\`\`yaml\n${yamlContent}\n\`\`\``;
            const result = extractYamlFromResponse(response);
            
            // Should extract from the yaml block, not the generic block
            expect(result).toBe(yamlContent.trim());
          }
        )
      );
    });

    it("should prefer code blocks over raw YAML", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => !s.includes("```")),
          fc.string({ minLength: 1 }).filter(s => !s.includes("```") && s.trim().length > 0),
          (rawYaml, blockYaml) => {
            // Create response with both raw YAML and code block
            const response = `id: ${rawYaml}\n\n\`\`\`yaml\n${blockYaml}\n\`\`\``;
            const result = extractYamlFromResponse(response);
            
            // Should extract from the code block, not the raw YAML
            expect(result).toBe(blockYaml.trim());
          }
        )
      );
    });

    it("should handle whitespace variations in code blocks", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => !s.includes("```") && !s.includes("`") && s.trim().length > 0),
          fc.nat({ max: 5 }),
          fc.nat({ max: 5 }),
          (yamlContent, leadingNewlines, trailingNewlines) => {
            const leading = "\n".repeat(leadingNewlines);
            const trailing = "\n".repeat(trailingNewlines);
            const response = `\`\`\`yaml${leading}${yamlContent}${trailing}\`\`\``;
            const result = extractYamlFromResponse(response);
            
            // Should extract and trim the content
            expect(result).toBe(yamlContent.trim());
          }
        )
      );
    });
  });
});
