import { describe, it, expect } from "vitest";
import { extractYamlFromResponse } from "../yaml-extractor";

describe("extractYamlFromResponse", () => {
  describe("```yaml code blocks", () => {
    it("should extract YAML from ```yaml code block", () => {
      const response = `Here's your schema:

\`\`\`yaml
id: myForm
type: form
\`\`\`

Hope this helps!`;

      const result = extractYamlFromResponse(response);
      expect(result).toBe("id: myForm\ntype: form");
    });

    it("should extract YAML from ```yml code block", () => {
      const response = `\`\`\`yml
type: page
id: page1
\`\`\``;

      const result = extractYamlFromResponse(response);
      expect(result).toBe("type: page\nid: page1");
    });

    it("should handle extra whitespace in yaml blocks", () => {
      const response = `\`\`\`yaml

id: test
type: form

\`\`\``;

      const result = extractYamlFromResponse(response);
      expect(result).toBe("id: test\ntype: form");
    });
  });

  describe("generic ``` code blocks", () => {
    it("should extract YAML from generic code block starting with id:", () => {
      const response = `\`\`\`
id: myForm
type: form
\`\`\``;

      const result = extractYamlFromResponse(response);
      expect(result).toBe("id: myForm\ntype: form");
    });

    it("should extract YAML from generic code block starting with type:", () => {
      const response = `\`\`\`
type: form
id: myForm
\`\`\``;

      const result = extractYamlFromResponse(response);
      expect(result).toBe("type: form\nid: myForm");
    });

    it("should not extract non-YAML content from generic code blocks", () => {
      const response = `\`\`\`
function test() {
  return true;
}
\`\`\``;

      const result = extractYamlFromResponse(response);
      expect(result).toBeNull();
    });
  });

  describe("raw YAML content", () => {
    it("should detect raw YAML starting with id:", () => {
      const response = `id: myForm
type: form
children:
  - type: text
    id: field1`;

      const result = extractYamlFromResponse(response);
      expect(result).toBe(response);
    });

    it("should detect raw YAML starting with type:", () => {
      const response = `type: form
id: myForm`;

      const result = extractYamlFromResponse(response);
      expect(result).toBe(response);
    });

    it("should handle raw YAML with leading whitespace", () => {
      const response = `   id: myForm
type: form`;

      const result = extractYamlFromResponse(response);
      expect(result).toBe("id: myForm\ntype: form");
    });
  });

  describe("no YAML found", () => {
    it("should return null for empty string", () => {
      const result = extractYamlFromResponse("");
      expect(result).toBeNull();
    });

    it("should return null for whitespace only", () => {
      const result = extractYamlFromResponse("   \n  \t  ");
      expect(result).toBeNull();
    });

    it("should return null for text without YAML", () => {
      const response = "I cannot help with that request.";
      const result = extractYamlFromResponse(response);
      expect(result).toBeNull();
    });

    it("should return null for code that doesn't look like YAML", () => {
      const response = `Here's some JavaScript:
const x = 5;
console.log(x);`;

      const result = extractYamlFromResponse(response);
      expect(result).toBeNull();
    });
  });

  describe("priority order", () => {
    it("should prefer ```yaml blocks over generic blocks", () => {
      const response = `\`\`\`
id: generic
\`\`\`

\`\`\`yaml
id: specific
\`\`\``;

      const result = extractYamlFromResponse(response);
      expect(result).toBe("id: specific");
    });

    it("should prefer code blocks over raw YAML", () => {
      const response = `id: raw

\`\`\`yaml
id: block
\`\`\``;

      const result = extractYamlFromResponse(response);
      expect(result).toBe("id: block");
    });
  });
});
