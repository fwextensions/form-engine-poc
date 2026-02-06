import { createContext, useContext } from "react";

export type ValidationResult = {
	extractedSchema?: string;
	validationErrors?: string[];
	validationWarnings?: string[];
	schemaApplied?: boolean;
};

export type ValidationResults = Map<string, ValidationResult>;

export const ValidationResultsContext = createContext<ValidationResults>(new Map());

export function useValidationResult(messageId: string): ValidationResult | undefined {
	const results = useContext(ValidationResultsContext);
	return results.get(messageId);
}
