import { createContext, useContext } from "react";
import type { PdfExtractionResult } from "@/lib/pdf-extraction";

export type PdfExtractionEntry = {
	result: PdfExtractionResult;
	filename: string;
};

/** Maps user message IDs to the PDF extraction result that was attached to that message. */
export type PdfExtractionMap = Map<string, PdfExtractionEntry>;

export const PdfExtractionContext = createContext<PdfExtractionMap>(new Map());

export function usePdfExtraction(messageId: string): PdfExtractionEntry | undefined {
	const map = useContext(PdfExtractionContext);
	return map.get(messageId);
}
