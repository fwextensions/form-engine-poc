/**
 * JSONL Patch System — Public Exports
 *
 * Provides the full JSONL patch pipeline:
 * - Types for patch operations
 * - Stream compiler (text chunks → parsed patches)
 * - Patch applier (patches → updated schema)
 * - History manager (undo/redo)
 * - Schema generator (JSONL-aware prompts)
 */

export type {
	SchemaComponent,
	PatchOp,
	AddOp,
	UpdateOp,
	RemoveOp,
	MoveOp,
	ReplaceOp,
	MessageOp,
	PatchGroup,
	ParseResult,
} from "./types";

export { createPatchStreamCompiler } from "./patch-compiler";
export { applyPatch, applyPatches } from "./patch-applier";
export type { ApplyResult, BatchApplyResult } from "./patch-applier";
export { createHistoryManager } from "./history";
export type { HistoryManager, HistoryState, SerializedHistory } from "./history";
export { JsonlSchemaGenerator } from "./schema-generator";
export { getJsonlPreamble, buildJsonlEditPrompt, buildJsonlCreatePrompt } from "./prompt";
