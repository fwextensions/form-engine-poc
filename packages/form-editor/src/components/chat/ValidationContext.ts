import { createContext, useContext } from "react";
import type { PatchOp } from "@/lib/jsonl/types";

export type PatchWithResult = {
	patch: PatchOp;
	/** undefined for message ops (always succeed, no apply step) */
	success?: boolean;
	error?: string;
	/** For remove ops: ID of a nearby field to highlight instead */
	nearFieldId?: string;
	/** For remove ops: whether the removed field was "before" or "after" the near field */
	nearFieldPosition?: "before" | "after";
};

export type ValidationResult = {
	extractedSchema?: string;
	validationErrors?: string[];
	validationWarnings?: string[];
	schemaApplied?: boolean;
	/** Parsed patches with per-op apply results, for card rendering */
	patchCards?: PatchWithResult[];
};

export type ValidationResults = Map<string, ValidationResult>;

export const ValidationResultsContext = createContext<ValidationResults>(new Map());

export function useValidationResult(messageId: string): ValidationResult | undefined {
	const results = useContext(ValidationResultsContext);
	return results.get(messageId);
}
