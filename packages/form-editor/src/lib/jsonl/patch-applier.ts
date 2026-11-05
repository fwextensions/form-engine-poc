/**
 * Patch Applier — Apply Patches to Schema JSON
 *
 * Takes the current form schema (as a JSON object) and applies JSONL patch
 * operations to produce the next state. All operations are immutable — a new
 * schema object is returned, leaving the input unchanged.
 *
 * Every component an operation introduces or changes is validated against the
 * form-engine registry before it is accepted, so the model gets a precise
 * error back instead of silently producing a tree the renderer cannot draw.
 */

import { ZodError } from "zod";
import { getComponentDefinition, getRegisteredCatalog, resolveAllowedChildren, validateSchemaTree } from "form-engine";
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

// ─── Registry validation ──────────────────────────────────────────────────────

/**
 * Validates one component (not its children) strictly against the registry.
 * Returns an error string, or null when valid.
 */
function componentError(component: SchemaComponent): string | null {
	if (!component || typeof component !== "object" || typeof component.type !== "string") {
		return "Component must be an object with a string `type`";
	}
	const definition = getComponentDefinition(component.type);
	if (!definition) {
		const types = Object.keys(getRegisteredCatalog().components).sort().join(", ");
		return `Unknown component type "${component.type}". Available types: ${types}`;
	}
	try {
		definition.validateConfig(component);
		return null;
	} catch (error) {
		if (error instanceof ZodError) {
			return error.issues
				.map((issue) => {
					const path = issue.path.filter((p): p is string | number => typeof p !== "symbol").join(".");
					return path ? `${path}: ${issue.message}` : issue.message;
				})
				.join("; ");
		}
		return String(error);
	}
}

/** Returns an error when `parent` may not contain a component of `childType`. */
function nestingError(parent: SchemaComponent, childType: string): string | null {
	const parentDef = getComponentDefinition(parent.type);
	if (!parentDef) return null; // unknown parents are reported elsewhere
	if (!parentDef.children) {
		return `"${parent.id ?? parent.type}" is a ${parent.type} and cannot contain children`;
	}
	const allowed = resolveAllowedChildren(getRegisteredCatalog(), parentDef);
	if (!allowed.includes(childType)) {
		return `A ${parent.type} cannot contain a ${childType}`;
	}
	return null;
}

/** Validates every node of a full tree; returns the first few errors joined. */
function treeError(schema: SchemaComponent): string | null {
	const errors = validateSchemaTree(schema).filter((issue) => issue.severity === "error");
	if (errors.length === 0) return null;
	const shown = errors.slice(0, 5).map((issue) => (issue.path ? `${issue.path}: ${issue.message}` : issue.message));
	const more = errors.length > 5 ? ` (and ${errors.length - 5} more)` : "";
	return shown.join("; ") + more;
}

// ─── Operations ───────────────────────────────────────────────────────────────

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
		return applyReplace(schema, patch);
	}

	// All other ops need a deep clone to work on
	const clone = deepClone(schema);

	switch (patch.op) {
		case "add":
			return applyAdd(schema, clone, patch);
		case "update":
			return applyUpdate(schema, clone, patch);
		case "remove":
			return applyRemove(clone, patch);
		case "move":
			return applyMove(schema, clone, patch);
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

function resolveParent(
	schema: SchemaComponent,
	parentId: string,
): ReturnType<typeof findById> {
	const found = findById(schema, parentId);
	if (found) return found;
	// "root" is a common model mistake — treat it as the schema root
	if (parentId === "root") {
		return { component: schema, parent: null, index: -1 };
	}
	return null;
}

function applyAdd(original: SchemaComponent, schema: SchemaComponent, patch: AddOp): ApplyResult {
	const parent = resolveParent(schema, patch.parentId);
	if (!parent) {
		return { schema: original, success: false, error: `Parent not found: ${patch.parentId}` };
	}

	const target = parent.component;

	const invalid = componentError(patch.component) ?? nestingError(target, patch.component.type);
	if (invalid) {
		return { schema: original, success: false, error: invalid };
	}
	if (patch.component.children?.length) {
		const childError = treeError(patch.component);
		if (childError) return { schema: original, success: false, error: childError };
	}
	if (patch.component.id && findById(schema, patch.component.id)) {
		return { schema: original, success: false, error: `A component with id "${patch.component.id}" already exists` };
	}

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

function applyUpdate(original: SchemaComponent, schema: SchemaComponent, patch: UpdateOp): ApplyResult {
	const found = findById(schema, patch.id);
	if (!found) {
		return { schema: original, success: false, error: `Component not found: ${patch.id}` };
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

	const invalid = componentError(target);
	if (invalid) {
		return { schema: original, success: false, error: `Update to "${patch.id}" rejected: ${invalid}` };
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

function applyMove(original: SchemaComponent, schema: SchemaComponent, patch: MoveOp): ApplyResult {
	// Remove the component from its current location
	const removed = removeById(schema, patch.id);
	if (!removed) {
		return { schema: original, success: false, error: `Component not found: ${patch.id}` };
	}

	// Find the new parent
	const parent = resolveParent(schema, patch.parentId);
	if (!parent) {
		return { schema: original, success: false, error: `New parent not found: ${patch.parentId}` };
	}

	const target = parent.component;
	const invalid = nestingError(target, removed.type);
	if (invalid) {
		return { schema: original, success: false, error: invalid };
	}
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

function applyReplace(original: SchemaComponent, patch: ReplaceOp): ApplyResult {
	const invalid = treeError(patch.schema);
	if (invalid) {
		return { schema: original, success: false, error: `Replacement schema rejected: ${invalid}` };
	}
	return { schema: deepClone(patch.schema), success: true };
}
