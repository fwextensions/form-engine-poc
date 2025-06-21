import { createContext, ReactNode, useContext } from "react";

export interface FormEngineContext {
	formData: Record<string, any>;
	onDataChange: (fieldName: string, value: any) => void;
	formContext: Record<string, any>; // Arbitrary context from the host application
	formMode: "edit" | "view" | "print"; // Current mode of the form
	onSubmit?: (formData: Record<string, any>) => void; // Handler for final form submission

	// New properties for multi-page navigation
	isMultiPage?: boolean;
	currentPageIndex?: number;
	totalPages?: number;
	onNavigateNext?: () => void;
	onNavigatePrev?: () => void;
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
