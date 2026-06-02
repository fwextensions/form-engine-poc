import { createContext, useContext } from "react";

export type FieldHighlightFn = (fieldId: string) => void;

export const FieldHighlightContext = createContext<FieldHighlightFn | null>(null);

export function useFieldHighlight(): FieldHighlightFn | null {
	return useContext(FieldHighlightContext);
}
