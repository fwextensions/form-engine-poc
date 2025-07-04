import React, {
	useState,
	useCallback,
	useMemo,
	useEffect,
	forwardRef,
	useImperativeHandle,
} from "react";
import type { FormConfig } from "../components/layout/Form";
import type { PageConfig } from "../components/layout/Page";
import {
	FormEngineProvider,
	type FormEngineContext
} from "./FormEngineContext";
import { DynamicRenderer } from "./DynamicRenderer";
import { useFormRules } from "../hooks/useFormRules";

export interface FormMeta {
	formTitle: string;
	pageCount: number;
	pageTitles: string[];
}

export interface FormEngineHandle {
	goToPage: (pageIndex: number) => void;
	getMeta: () => FormMeta & { currentPageIndex: number; currentPageTitle: string };
}

export interface FormEngineProps {
	schema: FormConfig;
	onSubmit?: (formData: Record<string, unknown>) => void;
	onDataChange?: (formData: Record<string, unknown>) => void;
	onPageChange?: (pageIndex: number, totalPages: number) => void;
	onMetaChange?: (meta: FormMeta) => void;
	currentPage?: number; // For controlled component
	displayMode?: "multipage" | "singlepage";
	formContext?: Record<string, unknown>;
	initialData?: Record<string, unknown>;
}

export const FormEngine = forwardRef<FormEngineHandle, FormEngineProps>(
	function FormEngine(
		{
			schema,
			onSubmit,
			onDataChange,
			onPageChange,
			onMetaChange,
			currentPage: controlledCurrentPage,
			displayMode,
			formContext = {},
			initialData = {},
		},
		ref,
	) {
		const [formData, setFormData] = useState<Record<string, unknown>>(initialData);
		const [internalCurrentPageIndex, setInternalCurrentPageIndex] = useState(0);

		const dynamicProps = useFormRules(schema, formData);

		const pageComponents = useMemo(() => {
			if (schema?.type === "form" && Array.isArray(schema.children)) {
				return schema.children.filter((child) => child?.type === "page") as PageConfig[];
			}
			return [];
		}, [schema]);

		// Effect to call onMetaChange when schema changes
		useEffect(() => {
			if (schema) {
				const meta: FormMeta = {
					formTitle: schema.title ?? 'Untitled Form',
					pageCount: pageComponents.length,
					pageTitles: pageComponents.map((p, i) => p.title ?? `Page ${i + 1}`),
				};
				onMetaChange?.(meta);
			}
		}, [schema, pageComponents, onMetaChange]);

		const totalPages = pageComponents.length;
		const isMultiPage = (displayMode ?? schema?.display) === 'multipage' && totalPages > 1;

		// Determine if the component is controlled or not for page navigation
		const isPageControlled = controlledCurrentPage !== undefined;
		const currentPageIndex = isPageControlled ? controlledCurrentPage : internalCurrentPageIndex;

		// Effect to call onPageChange when page changes
		useEffect(() => {
			if (isMultiPage) {
				onPageChange?.(currentPageIndex, totalPages);
			}
		}, [currentPageIndex, totalPages, isMultiPage, onPageChange]);

		const handleDataChange = useCallback(
			(fieldName: string, value: unknown) => {
				const newData = { ...formData, [fieldName]: value };
				setFormData(newData);
				onDataChange?.(newData);
			},
			[formData, onDataChange],
		);

		const handleNavigate = useCallback(
			(newIndex: number) => {
				if (newIndex >= 0 && newIndex < totalPages) {
					if (isPageControlled) {
						// If controlled, just notify the parent. Parent is responsible for updating the prop.
						onPageChange?.(newIndex, totalPages);
					} else {
						// If uncontrolled, update internal state
						setInternalCurrentPageIndex(newIndex);
					}
				}
			},
			[isPageControlled, onPageChange, totalPages],
		);

		useImperativeHandle(
			ref,
			() => ({
				goToPage: (pageIndex: number) => {
					handleNavigate(pageIndex);
				},
				getMeta: () => {
					const meta = {
						formTitle: schema.title ?? 'Untitled Form',
						pageCount: totalPages,
						pageTitles: pageComponents.map((p, i) => p.title ?? `Page ${i + 1}`),
						currentPageIndex,
						currentPageTitle: pageComponents[currentPageIndex]?.title ?? `Page ${currentPageIndex + 1}`,
					};
					return meta;
				},
			}),
			[handleNavigate, schema, totalPages, pageComponents, currentPageIndex],
		);

		const handleNextPage = useCallback(() => {
			// TODO: Add validation logic before navigating
			handleNavigate(currentPageIndex + 1);
		}, [currentPageIndex, handleNavigate]);

		const handlePrevPage = useCallback(
			() => handleNavigate(currentPageIndex - 1),
			[currentPageIndex, handleNavigate],
		);

		const handleFinalSubmit = useCallback(
			(submittedData: Record<string, unknown>) => onSubmit?.(submittedData),
			[onSubmit],
		);

		const { formMode = 'edit', ...restOfFormContext } = formContext;
		const formEngineContextValue: FormEngineContext = {
			formData,
			onDataChange: handleDataChange,
			formContext: restOfFormContext,
			formMode: formMode as 'edit' | 'preview' | 'view' | 'print',
			onSubmit: handleFinalSubmit,
			isMultiPage,
			currentPageIndex: isMultiPage ? currentPageIndex : undefined,
			totalPages: isMultiPage ? totalPages : undefined,
			onNavigateNext: isMultiPage ? handleNextPage : undefined,
			onNavigatePrev: isMultiPage ? handlePrevPage : undefined,
			dynamicProps, // Pass the dynamic props through the context
		};

		return (
			<FormEngineProvider value={formEngineContextValue}>
				<DynamicRenderer config={schema} context={formEngineContextValue} />
			</FormEngineProvider>
		);
	},
);
