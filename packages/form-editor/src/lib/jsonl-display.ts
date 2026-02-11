/**
 * JSONL Display Utility
 *
 * Detects JSONL patch content in assistant messages and extracts the
 * human-readable message text to display in chat bubbles instead of
 * showing raw JSON lines.
 */

/**
 * Check if a string looks like JSONL patch output.
 * Returns true if at least one line starts with `{"op":`.
 */
export function looksLikeJsonl(content: string): boolean {
	return content.split("\n").some((line) => {
		const trimmed = line.trim();
		return trimmed.startsWith('{"op":');
	});
}

/**
 * Extract the human-readable display text from JSONL patch output.
 *
 * Parses each line, collects `message` op texts, and counts
 * schema-modifying ops. Returns a friendly summary.
 */
export function extractJsonlDisplay(content: string): {
	/** The text to show in the chat bubble */
	displayText: string;
	/** Whether the response contains schema-modifying ops */
	hasSchemaChanges: boolean;
	/** Number of schema-modifying ops */
	changeCount: number;
} {
	const lines = content.split("\n");
	const messages: string[] = [];
	let changeCount = 0;

	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed) continue;

		try {
			const parsed = JSON.parse(trimmed);
			if (parsed.op === "message" && typeof parsed.text === "string") {
				messages.push(parsed.text);
			} else if (parsed.op && parsed.op !== "message") {
				changeCount++;
			}
		} catch {
			// Not valid JSON — ignore (could be partial streaming content)
		}
	}

	const displayText = messages.join("\n\n") || (changeCount > 0 ? "Form updated" : "");

	return {
		displayText,
		hasSchemaChanges: changeCount > 0,
		changeCount,
	};
}
