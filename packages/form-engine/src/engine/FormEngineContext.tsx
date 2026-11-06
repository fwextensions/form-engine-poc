import { createContext, ReactNode, useContext } from "react";
import type { FormMeta } from "./FormEngine";
import type { FormConfig } from "../components/layout/Form";

export interface FormEngineContext {
    formData: Record<string, any>;
    onDataChange: (fieldName: string, value: any) => void;
    formContext: Record<string, any>; // Arbitrary context from the host application
    formMode: "edit" | "preview" | "view" | "print"; // Current mode of the form
    onSubmit?: (formData: Record<string, any>) => void; // Handler for final form submission

	// New properties for multi-page navigation
	isMultiPage?: boolean;
	currentPageIndex?: number;
	totalPages?: number;
	onNavigateNext?: () => void;
	onNavigatePrev?: () => void;
    dynamicProps?: Record<string, Record<string, any>>;
    meta?: FormMeta;
	/** The whole form config, for components that need to see other fields (review). */
	schema?: FormConfig;
	/** Jumps to a page by index in multi-page mode. */
	onNavigateTo?: (pageIndex: number) => void;
	/**
	 * Prefix for DOM ids and input names when fields render inside a repeating
	 * group, so each item's controls stay unique. Data keys are unaffected.
	 */
	scope?: string;
}

/** DOM id / input name for a field id under the context's scope (the id itself at the top level). */
export function scopedId(context: Pick<FormEngineContext, "scope">, id: string): string {
	return context.scope ? `${context.scope}-${id}` : id;
}

// Default context value - provides sensible defaults or stubs for when no provider is found
// or for initial setup. Components should ideally always be under a Provider with actual values.
const defaultFormEngineContext: FormEngineContext = {
    formData: {},
    onDataChange: (fieldName: string, value: any) => {
        console.warn(
            `onDataChange called for field "${fieldName}" with value "${value}" but no FormEngineContext.Provider was found.`,
        );
    },
    formContext: {},
    formMode: "edit",
    onSubmit: (formData: Record<string, any>) => {
        console.warn(
            `onSubmit called with formData but no FormEngineContext.Provider was found.`, formData
        );
    },
    dynamicProps: {},
    meta: { formTitle: "", pageCount: 0, pageTitles: [] },
};

// Create the actual React Context
const FormEngineContextObject = createContext<FormEngineContext | undefined>(defaultFormEngineContext);

// Type alias for the context provider's props, for clarity.
// Note: 'children' is implicitly part of this due to React.FC.
export type FormEngineProviderProps = {
	value: FormEngineContext;
	children: ReactNode;
};

export function FormEngineProvider(
	props: FormEngineProviderProps)
{
	return (
		<FormEngineContextObject.Provider value={props.value}>
			{props.children}
		</FormEngineContextObject.Provider>
	);
}

export function useFormEngine()
{
	const context = useContext(FormEngineContextObject);

	if (!context) {
		throw new Error("useFormEngine() must be used within a FormEngineProvider.");
	}

	return context;
}
