/**
 * Extracts YAML content from an LLM response.
 * 
 * Handles multiple formats:
 * - ```yaml code blocks
 * - ```yml code blocks
 * - Generic ``` code blocks containing YAML-like content
 * - Raw YAML content (starts with id: or type:)
 * 
 * @param response - The LLM response text
 * @returns The extracted YAML content, or null if no valid YAML found
 */
export function extractYamlFromResponse(response: string): string | null {
  if (!response || response.trim().length === 0) {
    return null;
  }

  // Priority 1: Look for ```yaml or ```yml code blocks
  const yamlBlockMatch = response.match(/```ya?ml\s*([\s\S]*?)```/);
  if (yamlBlockMatch && yamlBlockMatch[1]) {
    const content = yamlBlockMatch[1].trim();
    return content.length > 0 ? content : null;
  }

  // Priority 2: Look for generic ``` code blocks
  const genericBlockMatch = response.match(/```\s*([\s\S]*?)```/);
  if (genericBlockMatch && genericBlockMatch[1]) {
    const content = genericBlockMatch[1].trim();
    // Check if it looks like YAML (starts with id: or type:)
    if (content.length > 0 && looksLikeYaml(content)) {
      return content;
    }
  }

  // Priority 3: Check if the raw response looks like YAML
  const trimmedResponse = response.trim();
  if (looksLikeYaml(trimmedResponse)) {
    return trimmedResponse;
  }

  return null;
}

/**
 * Checks if content looks like YAML by checking if it starts with
 * common form schema properties (id: or type:)
 */
function looksLikeYaml(content: string): boolean {
  const trimmed = content.trim();
  return trimmed.startsWith('id:') || trimmed.startsWith('type:');
}
