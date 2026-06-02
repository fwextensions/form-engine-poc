import { createContext, useContext } from "react";

export type HighlightEdge = "top" | "bottom";

export type FieldHighlightFn = (fieldId: string, edge?: HighlightEdge) => void;

export const FieldHighlightContext = createContext<FieldHighlightFn | null>(null);

export function useFieldHighlight(): FieldHighlightFn | null {
	return useContext(FieldHighlightContext);
}
