import { useFormEngine } from "./FormEngineContext";

export function useFormMeta() {
	const ctx = useFormEngine();
	const { meta, currentPageIndex, totalPages, formMode, formContext } = ctx;

	return {
		...(meta || { formTitle: "", pageCount: 0, pageTitles: [] }),
		currentPageIndex: currentPageIndex ?? 0,
		totalPages: totalPages ?? 1,
		formMode,
		formContext,
	};
}
