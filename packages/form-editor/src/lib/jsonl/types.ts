/**
 * JSONL Patch Types for Form Schema Editing
 *
 * Defines the operation types that an LLM can emit as JSONL lines to
 * incrementally modify a form schema. Inspired by the json-render approach
 * of streaming JSON patches rather than complete document replacement.
 */

/**
 * A component definition as it appears in the schema.
 * Matches the form-engine YAML/JSON structure.
 */
export interface SchemaComponent {
	type: string;
	id?: string;
	[key: string]: unknown;
	children?: SchemaComponent[];
}

/**
 * Add a new component as a child of an existing parent.
 *
 * If `index` is omitted, the component is appended to the end.
 * If `before` is specified, the component is inserted before the sibling with that ID.
 */
export interface AddOp {
	op: "add";
	parentId: string;
	component: SchemaComponent;
	index?: number;
	before?: string;
}

/**
 * Update properties of an existing component (shallow merge).
 * Does not affect children — only top-level properties are merged.
 */
export interface UpdateOp {
	op: "update";
	id: string;
	props: Record<string, unknown>;
}

/**
 * Remove a component by ID (and all its children).
 */
export interface RemoveOp {
	op: "remove";
	id: string;
}

/**
 * Move a component to a new parent and/or position.
 */
export interface MoveOp {
	op: "move";
	id: string;
	parentId: string;
	index?: number;
}

/**
 * Replace the entire schema in one shot (fallback for complex restructuring).
 */
export interface ReplaceOp {
	op: "replace";
	schema: SchemaComponent;
}

/**
 * A text message from the LLM (not a schema change).
 * Used when the LLM needs to explain what it did or answer a question.
 */
export interface MessageOp {
	op: "message";
	text: string;
}

/**
 * Union of all patch operation types.
 */
export type PatchOp = AddOp | UpdateOp | RemoveOp | MoveOp | ReplaceOp | MessageOp;

/**
 * A group of patches from a single LLM interaction, with metadata.
 */
export interface PatchGroup {
	/** Unique identifier for this group */
	id: string;
	/** The patches in this group, in order */
	patches: PatchOp[];
	/** When this group was created */
	timestamp: number;
	/** Human-readable description (from the user's prompt) */
	description: string;
	/** Snapshot of the schema before these patches were applied */
	snapshotBefore: SchemaComponent;
	/** Snapshot of the schema after these patches were applied */
	snapshotAfter: SchemaComponent;
}

/**
 * Result of parsing a JSONL line.
 */
export interface ParseResult {
	/** Successfully parsed patch, or null on failure */
	patch: PatchOp | null;
	/** Error message if parsing failed */
	error?: string;
	/** The raw line that was parsed */
	rawLine: string;
}
