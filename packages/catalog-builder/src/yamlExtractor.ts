/**
 * Extracts YAML content from LLM responses.
 *
 * Handles multiple formats that LLMs commonly produce:
 * - ```yaml code blocks
 * - ```yml code blocks
 * - Generic ``` code blocks containing YAML-like content
 * - Raw YAML content (starts with common root keys)
 */

/**
 * Extracts YAML content from an LLM response string.
 *
 * @returns The extracted YAML content, or null if no valid YAML found.
 */
export function extractYamlFromResponse(response: string): string | null {
	if (!response || response.trim().length === 0) {
		return null;
	}

	// Priority 1: explicit ```yaml or ```yml blocks
	const yamlBlockMatch = response.match(/```ya?ml\s*([\s\S]*?)```/);
	if (yamlBlockMatch && yamlBlockMatch[1]) {
		const content = yamlBlockMatch[1].trim();
		return content.length > 0 ? content : null;
	}

	// Priority 2: generic ``` blocks that look like YAML
	const genericBlockMatch = response.match(/```\s*([\s\S]*?)```/);
	if (genericBlockMatch && genericBlockMatch[1]) {
		const content = genericBlockMatch[1].trim();
		if (content.length > 0 && looksLikeYaml(content)) {
			return content;
		}
	}

	// Priority 3: raw response that looks like YAML
	const trimmed = response.trim();
	if (looksLikeYaml(trimmed)) {
		return trimmed;
	}

	return null;
}

/**
 * Extracts any text that appears after the YAML block in an LLM response.
 * Typically a summary or explanation from the LLM.
 */
export function extractTextAfterYaml(response: string): string | null {
	if (!response || response.trim().length === 0) {
		return null;
	}

	const yamlBlockMatch = response.match(/```ya?ml\s*[\s\S]*?```\s*([\s\S]*)/);
	if (yamlBlockMatch && yamlBlockMatch[1]) {
		const afterText = yamlBlockMatch[1].trim();
		return afterText.length > 0 ? afterText : null;
	}

	const genericBlockMatch = response.match(/```\s*[\s\S]*?```\s*([\s\S]*)/);
	if (genericBlockMatch && genericBlockMatch[1]) {
		const afterText = genericBlockMatch[1].trim();
		return afterText.length > 0 ? afterText : null;
	}

	return null;
}

function looksLikeYaml(content: string): boolean {
	const trimmed = content.trim();
	return trimmed.startsWith("id:") || trimmed.startsWith("type:");
}
