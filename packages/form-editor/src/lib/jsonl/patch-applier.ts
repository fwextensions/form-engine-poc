/**
 * Patch Applier — Apply Patches to Schema JSON
 *
 * Takes the current form schema (as a JSON object) and applies JSONL patch
 * operations to produce the next state. All operations are immutable — a new
 * schema object is returned, leaving the input unchanged.
 */

import type { PatchOp, SchemaComponent, AddOp, UpdateOp, RemoveOp, MoveOp, ReplaceOp } from "./types";

/**
 * Result of applying a single patch.
 */
export interface ApplyResult {
	/** The new schema state, or the original if the patch failed */
	schema: SchemaComponent;
	/** Whether the patch was applied successfully */
	success: boolean;
	/** Error message if the patch failed */
	error?: string;
	/** Collected message text from message ops */
	message?: string;
	/** For remove ops: the nearest sibling that can be highlighted instead */
	removedNear?: { id: string; position: "before" | "after" };
}

/**
 * Result of applying a batch of patches.
 */
export interface BatchApplyResult {
	/** The final schema state */
	schema: SchemaComponent;
	/** Results for each patch */
	results: ApplyResult[];
	/** Collected message text from message ops */
	messages: string[];
	/** Number of patches that succeeded */
	successCount: number;
	/** Number of patches that failed */
	failureCount: number;
}

/**
 * Deep clone a schema component tree.
 */
function deepClone<T>(obj: T): T {
	return JSON.parse(JSON.stringify(obj));
}

/**
 * Find a component by ID within the schema tree.
 * Returns the component and its parent (null for root).
 */
function findById(
	root: SchemaComponent,
	id: string,
): { component: SchemaComponent; parent: SchemaComponent | null; index: number } | null {
	if (root.id === id) {
		return { component: root, parent: null, index: -1 };
	}

	if (root.children) {
		for (let i = 0; i < root.children.length; i++) {
			if (root.children[i].id === id) {
				return { component: root.children[i], parent: root, index: i };
			}
			const found = findById(root.children[i], id);
			if (found) return found;
		}
	}

	return null;
}

/**
 * Remove a component by ID from the tree (mutating the clone).
 * Returns the removed component, or null if not found.
 */
function removeById(root: SchemaComponent, id: string): SchemaComponent | null {
	if (!root.children) return null;

	for (let i = 0; i < root.children.length; i++) {
		if (root.children[i].id === id) {
			return root.children.splice(i, 1)[0];
		}
		const removed = removeById(root.children[i], id);
		if (removed) return removed;
	}

	return null;
}

/**
 * Apply a single patch operation to a schema.
 * Returns a new schema (the input is not mutated).
 */
export function applyPatch(schema: SchemaComponent, patch: PatchOp): ApplyResult {
	// Message ops don't modify the schema
	if (patch.op === "message") {
		return { schema, success: true, message: patch.text };
	}

	// Replace replaces the entire schema
	if (patch.op === "replace") {
		return applyReplace(patch);
	}

	// All other ops need a deep clone to work on
	const clone = deepClone(schema);

	switch (patch.op) {
		case "add":
			return applyAdd(clone, patch);
		case "update":
			return applyUpdate(clone, patch);
		case "remove":
			return applyRemove(clone, patch);
		case "move":
			return applyMove(clone, patch);
		default:
			return { schema, success: false, error: `Unknown op: ${(patch as any).op}` };
	}
}

/**
 * Apply a batch of patches sequentially.
 */
export function applyPatches(schema: SchemaComponent, patches: PatchOp[]): BatchApplyResult {
	let current = schema;
	const results: ApplyResult[] = [];
	const messages: string[] = [];
	let successCount = 0;
	let failureCount = 0;

	for (const patch of patches) {
		const result = applyPatch(current, patch);
		results.push(result);

		if (result.success) {
			current = result.schema;
			successCount++;
			if (result.message) {
				messages.push(result.message);
			}
		} else {
			failureCount++;
		}
	}

	return { schema: current, results, messages, successCount, failureCount };
}

function applyAdd(schema: SchemaComponent, patch: AddOp): ApplyResult {
	const parent = findById(schema, patch.parentId);
	if (!parent) {
		return { schema, success: false, error: `Parent not found: ${patch.parentId}` };
	}

	const target = parent.component;

	// Ensure children array exists
	if (!target.children) {
		target.children = [];
	}

	// Determine insertion index
	let insertIndex = target.children.length; // default: append

	if (patch.before) {
		const beforeIndex = target.children.findIndex((c) => c.id === patch.before);
		if (beforeIndex >= 0) {
			insertIndex = beforeIndex;
		}
	} else if (typeof patch.index === "number") {
		insertIndex = Math.min(Math.max(0, patch.index), target.children.length);
	}

	target.children.splice(insertIndex, 0, patch.component);

	return { schema, success: true };
}

function applyUpdate(schema: SchemaComponent, patch: UpdateOp): ApplyResult {
	const found = findById(schema, patch.id);
	if (!found) {
		return { schema, success: false, error: `Component not found: ${patch.id}` };
	}

	const target = found.component;

	// Shallow merge props onto the component
	for (const [key, value] of Object.entries(patch.props)) {
		if (key === "children") {
			// Children are managed through add/remove/move ops, not update
			continue;
		}
		if (value === null || value === undefined) {
			// Setting to null/undefined removes the property
			delete target[key];
		} else {
			target[key] = value;
		}
	}

	return { schema, success: true };
}

function applyRemove(schema: SchemaComponent, patch: RemoveOp): ApplyResult {
	// Can't remove the root
	if (schema.id === patch.id) {
		return { schema, success: false, error: "Cannot remove the root component" };
	}

	// Find the component's location before removing so we can record a neighbor
	const found = findById(schema, patch.id);
	let removedNear: { id: string; position: "before" | "after" } | undefined;

	if (found?.parent?.children) {
		const siblings = found.parent.children;
		const idx = found.index;
		if (idx > 0 && siblings[idx - 1].id) {
			removedNear = { id: siblings[idx - 1].id!, position: "after" };
		} else if (idx < siblings.length - 1 && siblings[idx + 1].id) {
			removedNear = { id: siblings[idx + 1].id!, position: "before" };
		} else if (found.parent.id) {
			removedNear = { id: found.parent.id, position: "after" };
		}
	}

	const removed = removeById(schema, patch.id);
	if (!removed) {
		return { schema, success: false, error: `Component not found: ${patch.id}` };
	}

	return { schema, success: true, removedNear };
}

function applyMove(schema: SchemaComponent, patch: MoveOp): ApplyResult {
	// Remove the component from its current location
	const removed = removeById(schema, patch.id);
	if (!removed) {
		return { schema, success: false, error: `Component not found: ${patch.id}` };
	}

	// Find the new parent
	const parent = findById(schema, patch.parentId);
	if (!parent) {
		// Oops, put it back (best effort — we already mutated the clone)
		return { schema, success: false, error: `New parent not found: ${patch.parentId}` };
	}

	const target = parent.component;
	if (!target.children) {
		target.children = [];
	}

	const insertIndex =
		typeof patch.index === "number"
			? Math.min(Math.max(0, patch.index), target.children.length)
			: target.children.length;

	target.children.splice(insertIndex, 0, removed);

	return { schema, success: true };
}

function applyReplace(_patch: ReplaceOp): ApplyResult {
	return { schema: deepClone(_patch.schema), success: true };
}
