/**
 * History Manager — Rolling Undo/Redo for JSONL Patches
 *
 * Maintains a stack of patch groups, each representing a single LLM
 * interaction. Supports undo (revert to snapshot before) and redo
 * (re-apply patches from the group).
 *
 * Uses a snapshot-based approach: each history entry stores the full
 * schema state before and after the patches were applied. This makes
 * undo/redo O(1) and avoids the complexity of inverse patch computation.
 */

import type { SchemaComponent, PatchGroup, PatchOp } from "./types";

export interface HistoryState {
	/** The current schema state */
	schema: SchemaComponent;
	/** Whether undo is available */
	canUndo: boolean;
	/** Whether redo is available */
	canRedo: boolean;
	/** Number of entries in the undo stack */
	undoCount: number;
	/** Number of entries in the redo stack */
	redoCount: number;
	/** Description of the next undo action */
	undoDescription?: string;
	/** Description of the next redo action */
	redoDescription?: string;
	/** All history entries (for display) */
	entries: PatchGroup[];
	/** Index of the current position in the history */
	currentIndex: number;
}

/**
 * Create a new history manager.
 *
 * @param initialSchema - The starting schema state
 * @param maxEntries - Maximum number of history entries to keep (default: 50)
 */
export function createHistoryManager(initialSchema: SchemaComponent, maxEntries = 50) {
	let entries: PatchGroup[] = [];
	/** Points to the last applied entry index. -1 means at the initial state. */
	let currentIndex = -1;
	let baseSchema = deepClone(initialSchema);

	function deepClone<T>(obj: T): T {
		return JSON.parse(JSON.stringify(obj));
	}

	function generateId(): string {
		return `pg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
	}

	return {
		/**
		 * Record a new patch group (from an LLM interaction).
		 * Truncates any redo history beyond the current position.
		 */
		push(
			patches: PatchOp[],
			snapshotBefore: SchemaComponent,
			snapshotAfter: SchemaComponent,
			description: string,
		): PatchGroup {
			// Truncate any redo entries
			entries = entries.slice(0, currentIndex + 1);

			const group: PatchGroup = {
				id: generateId(),
				patches: deepClone(patches),
				timestamp: Date.now(),
				description,
				snapshotBefore: deepClone(snapshotBefore),
				snapshotAfter: deepClone(snapshotAfter),
			};

			entries.push(group);
			currentIndex = entries.length - 1;

			// Trim oldest entries if over the limit
			if (entries.length > maxEntries) {
				const excess = entries.length - maxEntries;
				entries = entries.slice(excess);
				currentIndex -= excess;
				// Update base schema to the snapshot-before of the first remaining entry
				if (entries.length > 0) {
					baseSchema = deepClone(entries[0].snapshotBefore);
				}
			}

			return group;
		},

		/**
		 * Undo the last applied patch group.
		 * Returns the schema state to revert to, or null if nothing to undo.
		 */
		undo(): SchemaComponent | null {
			if (currentIndex < 0) return null;

			const entry = entries[currentIndex];
			currentIndex--;

			return deepClone(entry.snapshotBefore);
		},

		/**
		 * Redo the next patch group.
		 * Returns the schema state to advance to, or null if nothing to redo.
		 */
		redo(): SchemaComponent | null {
			if (currentIndex >= entries.length - 1) return null;

			currentIndex++;
			const entry = entries[currentIndex];

			return deepClone(entry.snapshotAfter);
		},

		/**
		 * Jump to a specific history entry by index.
		 * Returns the schema state at that point.
		 */
		goTo(index: number): SchemaComponent | null {
			if (index < -1 || index >= entries.length) return null;

			currentIndex = index;

			if (index === -1) {
				return deepClone(baseSchema);
			}

			return deepClone(entries[index].snapshotAfter);
		},

		/**
		 * Get the current history state (for UI binding).
		 */
		getState(): HistoryState {
			const currentSchema =
				currentIndex >= 0
					? deepClone(entries[currentIndex].snapshotAfter)
					: deepClone(baseSchema);

			return {
				schema: currentSchema,
				canUndo: currentIndex >= 0,
				canRedo: currentIndex < entries.length - 1,
				undoCount: currentIndex + 1,
				redoCount: entries.length - 1 - currentIndex,
				undoDescription:
					currentIndex >= 0 ? entries[currentIndex].description : undefined,
				redoDescription:
					currentIndex < entries.length - 1
						? entries[currentIndex + 1].description
						: undefined,
				entries: [...entries],
				currentIndex,
			};
		},

		/**
		 * Reset the history with a new base schema.
		 * Clears all entries.
		 */
		reset(newBaseSchema: SchemaComponent) {
			entries = [];
			currentIndex = -1;
			baseSchema = deepClone(newBaseSchema);
		},

		/**
		 * Replace the base schema without clearing history.
		 * Useful when the user manually edits the YAML.
		 * Clears redo history and creates a "manual edit" entry.
		 */
		recordManualEdit(
			schemaBefore: SchemaComponent,
			schemaAfter: SchemaComponent,
		): PatchGroup {
			return this.push(
				[{ op: "replace", schema: schemaAfter }],
				schemaBefore,
				schemaAfter,
				"Manual edit",
			);
		},

		/**
		 * Get all entries (for serialization/display).
		 */
		getEntries(): PatchGroup[] {
			return [...entries];
		},

		/**
		 * Get the current schema without full state.
		 */
		getCurrentSchema(): SchemaComponent {
			if (currentIndex >= 0) {
				return deepClone(entries[currentIndex].snapshotAfter);
			}
			return deepClone(baseSchema);
		},
	};
}

export type HistoryManager = ReturnType<typeof createHistoryManager>;
