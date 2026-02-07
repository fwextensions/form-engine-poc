/**
 * Patch Compiler — Stream Text → Typed Patches
 *
 * Processes streamed text from the LLM response, extracts complete JSONL lines,
 * and parses them into typed patch operations. Handles partial lines, SSE
 * formatting, and code block wrappers.
 *
 * Inspired by json-render's `createSpecStreamCompiler`.
 */

import type { PatchOp, ParseResult } from "./types";

const VALID_OPS = new Set(["add", "update", "remove", "move", "replace", "message"]);

/**
 * Creates a stateful stream compiler that accumulates text chunks
 * and yields parsed patch operations as complete JSONL lines arrive.
 */
export function createPatchStreamCompiler() {
	let buffer = "";

	return {
		/**
		 * Push a new chunk of streamed text into the compiler.
		 * Returns any newly parsed patches from complete lines.
		 */
		push(chunk: string): { patches: ParseResult[]; hasMore: boolean } {
			buffer += chunk;
			const results: ParseResult[] = [];

			// Split buffer into lines
			const lines = buffer.split("\n");

			// The last element might be an incomplete line — keep it in the buffer
			buffer = lines.pop() || "";

			for (const rawLine of lines) {
				const cleaned = cleanLine(rawLine);
				if (!cleaned) continue; // skip empty lines

				const result = parsePatchLine(cleaned);
				results.push(result);
			}

			return {
				patches: results,
				hasMore: buffer.length > 0,
			};
		},

		/**
		 * Flush any remaining content in the buffer.
		 * Call this when the stream ends to process any trailing content.
		 */
		flush(): ParseResult[] {
			const results: ParseResult[] = [];

			if (buffer.trim()) {
				const cleaned = cleanLine(buffer);
				if (cleaned) {
					results.push(parsePatchLine(cleaned));
				}
			}

			buffer = "";
			return results;
		},

		/**
		 * Reset the compiler state.
		 */
		reset() {
			buffer = "";
		},

		/**
		 * Get the current buffer contents (for debugging).
		 */
		getBuffer(): string {
			return buffer;
		},
	};
}

/**
 * Clean a raw line by stripping SSE prefixes, code block markers, etc.
 */
function cleanLine(line: string): string | null {
	let cleaned = line.trim();

	// Skip empty lines
	if (!cleaned) return null;

	// Strip SSE "data: " prefix
	if (cleaned.startsWith("data:")) {
		cleaned = cleaned.slice(5).trim();
	}

	// Skip code block markers
	if (cleaned === "```" || cleaned === "```json" || cleaned === "```jsonl") {
		return null;
	}

	// Skip markdown code block fences with any language
	if (cleaned.startsWith("```")) {
		return null;
	}

	return cleaned;
}

/**
 * Parse a single cleaned line into a PatchOp.
 */
function parsePatchLine(line: string): ParseResult {
	try {
		const parsed = JSON.parse(line);

		if (typeof parsed !== "object" || parsed === null) {
			return { patch: null, error: "Parsed value is not an object", rawLine: line };
		}

		if (!parsed.op || !VALID_OPS.has(parsed.op)) {
			return {
				patch: null,
				error: `Invalid or missing op: ${JSON.stringify(parsed.op)}`,
				rawLine: line,
			};
		}

		// Basic structural validation per op type
		const validationError = validatePatchStructure(parsed);
		if (validationError) {
			return { patch: null, error: validationError, rawLine: line };
		}

		return { patch: parsed as PatchOp, error: undefined, rawLine: line };
	} catch (e) {
		return {
			patch: null,
			error: `JSON parse error: ${e instanceof Error ? e.message : String(e)}`,
			rawLine: line,
		};
	}
}

/**
 * Validate the structure of a parsed patch object.
 */
function validatePatchStructure(patch: Record<string, unknown>): string | null {
	switch (patch.op) {
		case "add":
			if (!patch.parentId || typeof patch.parentId !== "string") {
				return "add: requires string 'parentId'";
			}
			if (!patch.component || typeof patch.component !== "object") {
				return "add: requires object 'component'";
			}
			break;

		case "update":
			if (!patch.id || typeof patch.id !== "string") {
				return "update: requires string 'id'";
			}
			if (!patch.props || typeof patch.props !== "object") {
				return "update: requires object 'props'";
			}
			break;

		case "remove":
			if (!patch.id || typeof patch.id !== "string") {
				return "remove: requires string 'id'";
			}
			break;

		case "move":
			if (!patch.id || typeof patch.id !== "string") {
				return "move: requires string 'id'";
			}
			if (!patch.parentId || typeof patch.parentId !== "string") {
				return "move: requires string 'parentId'";
			}
			break;

		case "replace":
			if (!patch.schema || typeof patch.schema !== "object") {
				return "replace: requires object 'schema'";
			}
			break;

		case "message":
			if (typeof patch.text !== "string") {
				return "message: requires string 'text'";
			}
			break;
	}

	return null;
}

export { parsePatchLine, cleanLine };
