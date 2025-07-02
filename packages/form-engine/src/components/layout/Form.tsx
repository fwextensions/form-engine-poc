// packages/form-engine/src/components/layout/Form.tsx
import React, { useEffect, useRef } from "react";
import { z } from "zod";
import { Submit, Root } from "@radix-ui/react-form";
import { baseLayoutComponentConfigSchema } from "../baseSchemas";
import { createComponent } from "../../core/componentFactory";
import { FormEngineContext, useFormEngine } from "../../core/FormEngineContext";

// 1. Define Configuration Schema
export const FormConfigSchema = baseLayoutComponentConfigSchema.extend({
	type: z.literal("form"),
	display: z.enum(["multipage", "singlepage"]).optional(),
	// submitButtonText will be used for the final submit in single-page, or last page of multi-page
	submitButtonText: z.string().optional().default("Submit"),
	nextButtonText: z.string().optional().default("Next"),
	previousButtonText: z.string().optional().default("Previous"),
	buttonsClassName: z.string().optional(), // General class for the buttons container
	previousButtonClassName: z.string().optional(),
	nextButtonClassName: z.string().optional(),
	submitButtonClassName: z.string().optional(), // For the final submit button
	className: z.string().optional(),
	style: z.record(z.string(), z.any()).optional(),
});
export type FormConfig = z.infer<typeof FormConfigSchema>;

// 2. Define Props for the React Component
// Most props will now come from context or be part of the config passed to transformProps
export interface FormProps extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
	config: FormConfig; // Pass the full config for button texts etc.
	children?: React.ReactNode; // All potential children (pages)
}

// 3. Create the React Component
export const FormComponent: React.FC<FormProps> = ({
	config,
	children,
	className, // This will be from config.className via transformProps
	style,     // This will be from config.style via transformProps
	...rest
}) => {
	const context = useFormEngine();
	const pageContentRef = useRef<HTMLDivElement>(null);

	if (!context) {
		console.error("FormComponent must be rendered within a FormEngineContextObject.Provider");
		return <div>Error: Form context not found.</div>;
	}

	const {
		formData,
		onSubmit: onFinalSubmit, // Renaming to avoid conflict with Radix's onSubmit prop
		isMultiPage,
		currentPageIndex,
		totalPages,
		onNavigateNext,
		onNavigatePrev,
		formMode
	} = context;
	const isViewMode = formMode === "view";
	const isEditMode = formMode === "edit";
	let currentChildren = children;
	const showSubmit = !isMultiPage && onFinalSubmit;
	const showNext = isMultiPage && currentPageIndex !== undefined && totalPages !== undefined && currentPageIndex < totalPages - 1;
	const showFinalSubmitMultiPage = isMultiPage && currentPageIndex !== undefined && totalPages !== undefined && currentPageIndex === totalPages - 1 && onFinalSubmit;
	const showPrevious = isMultiPage && currentPageIndex !== undefined && currentPageIndex > 0 && onNavigatePrev;

	useEffect(() => {
		if (isEditMode && pageContentRef.current) {
			// Find the first focusable element. This query can be adjusted as needed.
			const focusableElements = pageContentRef.current.querySelectorAll<HTMLElement>(
				'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])'
			);
			const firstFocusableElement = Array.from(focusableElements).find(el => el.offsetParent !== null); // Check if visible

			if (firstFocusableElement) {
				firstFocusableElement.focus();
			}
		}
	}, [currentPageIndex, isEditMode]);

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (isViewMode) return;

		if (isMultiPage && onNavigateNext && currentPageIndex !== undefined && totalPages !== undefined && currentPageIndex < totalPages - 1) {
			onNavigateNext();
		} else if (onFinalSubmit && formData) {
			onFinalSubmit(formData);
		}
	};

	if (isMultiPage && currentPageIndex !== undefined && Array.isArray(children)) {
		// In multi-page, children of the 'form' are 'page' components.
		// We need to find all 'page' type children from the original config to determine the current page.
		// The 'children' prop passed to FormComponent is already processed by DynamicRenderer,
		// so it should be an array of ReactElements if children were defined in schema.
		currentChildren = children[currentPageIndex] ? [children[currentPageIndex]] : [];
	}

	return (
		<Root
			{...rest} // Passes through other HTML attributes like id
			className={`space-y-6 ${className || ''}`}
			style={style}
			onSubmit={handleSubmit}
		>
			<div ref={pageContentRef}>
				{currentChildren}
			</div>

			{(!isViewMode && (showSubmit || showNext || showFinalSubmitMultiPage || showPrevious)) && (
				<div className={`mt-6 pt-4 border-t border-gray-200 flex ${showPrevious ? 'justify-between' : 'justify-end'} items-center ${config.buttonsClassName || ''}`}>
					{showPrevious && (
						<button
							type="button" // Important: not a submit type
							onClick={onNavigatePrev}
							className={`px-4 py-2 text-gray-700 bg-gray-100 rounded-md shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 ${config.previousButtonClassName || ''}`}
							disabled={isViewMode}
						>
							{config.previousButtonText}
						</button>
					)}

					{(showSubmit || showNext || showFinalSubmitMultiPage) && (
						<Submit asChild>
							<button
								type="submit"
								className={`px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed ${showNext ? (config.nextButtonClassName || '') : (config.submitButtonClassName || '')}`}
								disabled={isViewMode}
							>
								{showNext ? config.nextButtonText : config.submitButtonText}
							</button>
						</Submit>
					)}
				</div>
			)}
		</Root>
	);
};

// 4. Register the Component
createComponent<FormConfig, FormProps>({
	type: "form",
	schema: FormConfigSchema,
	component: FormComponent,
	// transformProps now primarily passes the original config and children
	// The component itself will use context for most dynamic values and actions
	transformProps: (config: FormConfig, context: FormEngineContext, renderChildren): FormProps => {
		const { id, children, className, style } = config;
		// In multi-page, DynamicRenderer inside FormComponent will get page-specific children.
		// Here, we pass all children definitions to be processed by FormComponent itself based on context.
		// However, renderChildren is typically used to render the children *before* passing them to the component.
		// For a 'form' component that manages its own pages, we might need a different approach
		// if renderChildren is too eager.
		// For now, let's assume FormComponent receives the *React Elements* of its direct children.

		const renderedChildElements = renderChildren(children, context);

		return {
			id: id || "form-engine-root",
			config, // Pass the full config
			className, // Pass className from config
			style,     // Pass style from config
			children: renderedChildElements, // Pass rendered children (pages)
		};
	},
});
