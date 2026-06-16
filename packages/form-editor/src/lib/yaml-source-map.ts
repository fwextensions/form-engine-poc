/**
 * Utilities for mapping field IDs to their source location in YAML text.
 * Used for click-to-source navigation between the form preview and YAML editor.
 */

/**
 * Escape special regex characters in a string.
 */
function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Find the line number (1-indexed) where a field's `id:` key appears in the YAML.
 * Returns null if not found.
 *
 * This uses a simple text search which works well because field IDs are unique
 * within a form schema. It handles both quoted and unquoted ID values,
 * and accounts for YAML array item markers (e.g., `- id: fieldName`).
 */
export function findFieldLineInYaml(yaml: string, fieldId: string): number | null {
	const lines = yaml.split("\n");
	const escaped = escapeRegex(fieldId);

	// Match `id: fieldId` with optional array item marker, optional quotes, optional trailing comment
	// Handles: `  id: foo`, `  - id: foo`, `  id: "foo"`, `  - id: 'foo'`, `  id: foo # comment`
	const pattern = new RegExp(`^\\s*(-\\s+)?id:\\s*['"]?${escaped}['"]?\\s*(#.*)?$`);

	for (let i = 0; i < lines.length; i++) {
		if (pattern.test(lines[i])) {
			return i + 1; // Monaco uses 1-indexed line numbers
		}
	}

	return null;
}

/**
 * Find the YAML block range for a component given its `id:` line.
 * Returns the start and end lines (1-indexed, inclusive) of the component block.
 *
 * Handles two YAML array item formats:
 * - Compact: `- id: fieldName` (marker + first key on same line)
 * - Expanded: `- \n  id: fieldName` (marker on its own line, rare)
 *
 * The block extends from the `- ` array item marker through all subsequent lines
 * that are indented further than the marker, stopping at the next sibling `- ` item
 * or a line at equal/lower indentation.
 */
export function findFieldBlockRange(
	yaml: string,
	idLine: number,
): { startLine: number; endLine: number } | null {
	const lines = yaml.split("\n");
	const idLineIndex = idLine - 1; // Convert to 0-indexed

	if (idLineIndex < 0 || idLineIndex >= lines.length) return null;

	const idLineText = lines[idLineIndex];

	// Determine if this line itself starts with `- ` (compact format: `- id: foo`)
	const compactMatch = idLineText.match(/^(\s*)-\s/);
	let startIndex: number;
	let markerIndent: number;

	if (compactMatch) {
		// The id line IS the array item start (e.g., `    - id: firstName`)
		startIndex = idLineIndex;
		markerIndent = compactMatch[1].length; // indent of the `- ` marker
	} else {
		// The id line is a child of the array item — walk backwards to find `- `
		const idIndent = getIndent(idLineText);
		startIndex = idLineIndex;
		markerIndent = idIndent;

		for (let i = idLineIndex - 1; i >= 0; i--) {
			const line = lines[i];
			if (line.trim() === "") continue;

			const dashMatch = line.match(/^(\s*)-\s/);
			if (dashMatch && dashMatch[1].length < idIndent) {
				startIndex = i;
				markerIndent = dashMatch[1].length;
				break;
			}
			// If we hit something at lower indent that's not a list item, stop
			if (getIndent(line) < idIndent) {
				startIndex = i + 1;
				break;
			}
		}
	}

	// Walk forward to find the end of this component block.
	// Stop when we hit the next sibling list item (same `- ` indent) or lower indent.
	let endIndex = idLineIndex;

	for (let i = idLineIndex + 1; i < lines.length; i++) {
		const line = lines[i];
		if (line.trim() === "") {
			endIndex = i;
			continue;
		}

		// Check if this is a sibling list item at the same level
		const dashMatch = line.match(/^(\s*)-\s/);
		if (dashMatch && dashMatch[1].length <= markerIndent) {
			break;
		}

		// Or a non-list line at equal/lower indent than the marker
		if (!dashMatch && getIndent(line) <= markerIndent) {
			break;
		}

		endIndex = i;
	}

	// Trim trailing blank lines from the selection
	while (endIndex > startIndex && lines[endIndex].trim() === "") {
		endIndex--;
	}

	return {
		startLine: startIndex + 1, // Convert to 1-indexed
		endLine: endIndex + 1,
	};
}

/**
 * Get the indentation level (number of leading spaces) of a line.
 */
function getIndent(line: string): number {
	const match = line.match(/^(\s*)/);
	return match ? match[1].length : 0;
}
