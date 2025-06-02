"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
	DynamicRenderer,
	FormEngineContext,
	FormEngineContextObject,
	parseRootFormSchema,
	FormConfig,
} from "form-engine";
import { z } from "zod"; // Import z for ZodFormattedError
import schemaData from "@/schemas/poc-simple-form.yaml";
import { useRouter } from "next/navigation";

export default function HomePage() {
	const router = useRouter();

	const [parsedRootConfig, setParsedRootConfig] = useState<FormConfig | null>(null);
	const [schemaErrors, setSchemaErrors] = useState<z.ZodFormattedError<unknown> | null>(null);
	const [formData, setFormData] = useState<Record<string, unknown>>({});
	const [isClient, setIsClient] = useState(false);
	const [currentPageIndex, setCurrentPageIndex] = useState(0);
	const [isMultiPage, setIsMultiPage] = useState(true); // Default to multi-page view

	// The imported schemaData is already a JavaScript object thanks to yaml-loader
	// Parse the schema using the new parseRootFormSchema
	useEffect(() => {
		setIsClient(true);
		// Assuming schemaData is the raw configuration object for the root component (e.g., a "form" component)
		const result = parseRootFormSchema(schemaData);
//		console.log("SchemaViewerPage - Parsed Root Config:", JSON.stringify(result.config, null, 2));

		if (result.config) {
			setParsedRootConfig(result.config as FormConfig); // Cast to FormConfig
			setSchemaErrors(null);
			// TODO: Initialize formData based on defaultValues in schema if any
			// This might be handled by the "form" component itself or require logic here.
		} else if (result.errors) {
			console.error("Schema parsing errors:", result.errors.flatten());
			setParsedRootConfig(null);
			setSchemaErrors(result.errors.format()); // Use .format() for ZodFormattedError
		}
	}, []); // Assuming schemaData is stable; if it can change, add it to dependencies

	// Extract page components from the root config
	const pageComponents = React.useMemo(() => {
		if (parsedRootConfig && parsedRootConfig.type === "form" && Array.isArray(parsedRootConfig.children)) {
			return parsedRootConfig.children.filter(child => child.type === "page");
		}
		return [];
	}, [parsedRootConfig]);

	const totalPages = pageComponents.length;

	const handleNextPage = () => {
		if (currentPageIndex < totalPages - 1) {
			setCurrentPageIndex(currentPageIndex + 1);
		}
	};

	const handlePrevPage = () => {
		if (currentPageIndex > 0) {
			setCurrentPageIndex(currentPageIndex - 1);
		}
	};

	const handleToggleMultiPage = (event: React.ChangeEvent<HTMLInputElement>) => {
		setIsMultiPage(event.target.checked);
		setCurrentPageIndex(0); // Reset to first page when toggling mode
	};

	// Define the context object to be passed to the form
	const initialContext = {
		listingId: "listing-123-abc", // Example listing ID
		userRole: "applicant", // Example user role
		// Add other relevant context data here, e.g., from URL params, user session, etc.
	};

	const handleSubmit = (submittedFormData: Record<string, unknown>) => {
		console.log("Form submitted:", submittedFormData);
		const stringifiedData: Record<string, string> = {};
		for (const key in submittedFormData) {
			if (Object.prototype.hasOwnProperty.call(submittedFormData, key)) {
				// Ensure values are strings for URLSearchParams
				const value = submittedFormData[key];
				if (value !== null && value !== undefined) {
					stringifiedData[key] = String(value);
				} else {
					stringifiedData[key] = ""; // Represent null/undefined as empty string or omit
				}
			}
		}
		const queryParams = new URLSearchParams(stringifiedData).toString();
		router.push(`/submission?${queryParams}`);
	};

	const handleDataChange = useCallback((fieldName: string, value: unknown) => {
		setFormData((prevData) => ({ ...prevData, [fieldName]: value }));
	}, []);

	// Construct FormEngineContext value
	const formEngineContextValue: FormEngineContext = {
		formData,
		onDataChange: handleDataChange,
		formContext: initialContext, // Provide the initial context
		formMode: "edit", // Or 'view', 'print' based on needs
		onSubmit: handleSubmit,
	};

	// Determine the config to render based on the display mode
	let configToRender: FormConfig | null = null;
	if (parsedRootConfig) {
		if (isMultiPage && parsedRootConfig.type === "form" && totalPages > 0) {
			const currentPageConfig = pageComponents[currentPageIndex];
			if (currentPageConfig) {
				configToRender = {
					...parsedRootConfig, // Spread root form properties (like title, type)
					children: [currentPageConfig], // Only render the current page
					submitButtonText: undefined, // Prevent FormComponent from rendering its own submit in multi-page
				};
			}
		} else {
			// Single page mode or not a form with pages, render the whole thing
			// FormComponent will use its own submitButtonText from parsedRootConfig
			configToRender = parsedRootConfig;
		}
	}

	if (!configToRender) {
		return (
			<main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-100">
				<div className="text-gray-700 font-bold text-xl">
					Loading form or no pages to display...
				</div>
			</main>
		);
	}

	if (schemaErrors) {
		return (
			<main className="flex min-h-screen flex-col items-center justify-center p-24 bg-red-100">
				<div className="text-red-700 font-bold text-xl">
					Error: Could not parse form schema.
				</div>
				<pre className="mt-4 p-4 bg-white text-sm text-red-600 border border-red-300 rounded-md overflow-auto max-w-2xl">
					{JSON.stringify(schemaErrors, null, 2)}
				</pre>
			</main>
		);
	}

	return (
		<FormEngineContextObject.Provider value={formEngineContextValue}>
			<main className="flex min-h-screen flex-col items-start justify-start p-5 md:p-8 lg:p-12 bg-gray-100 w-full">
				{isClient && parsedRootConfig && parsedRootConfig.type === "form" && totalPages > 1 && (
					<div className="mb-4 p-4 border border-gray-300 rounded-md bg-white w-full max-w-3xl mx-auto">
						<label className="flex items-center space-x-2">
							<input
								type="checkbox"
								checked={isMultiPage}
								onChange={handleToggleMultiPage}
								className="form-checkbox h-5 w-5 text-indigo-600"
							/>
							<span>Navigate pages one by one</span>
						</label>
						{isMultiPage && (
							<p className="text-sm text-gray-600 mt-1">
								Page {currentPageIndex + 1} of {totalPages}
							</p>
						)}
					</div>
				)}

				<div className="w-full max-w-3xl mx-auto bg-white p-6 md:p-8 rounded-lg shadow-md">
					{/* Render the DynamicRenderer with the (potentially modified) config and context */}
					<DynamicRenderer config={configToRender} context={formEngineContextValue} />
				</div>

				{/* Navigation and Submit buttons for multi-page view */}
				{isClient && isMultiPage && parsedRootConfig && parsedRootConfig.type === "form" && totalPages > 0 && (
					<div className="mt-6 flex justify-between items-center w-full max-w-3xl mx-auto">
						<button
							onClick={handlePrevPage}
							disabled={currentPageIndex === 0}
							className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 transition-colors"
						>
							Previous
						</button>

						{currentPageIndex < totalPages - 1 ? (
							<button
								onClick={handleNextPage}
								className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
							>
								Next
							</button>
						) : (
							<button
								onClick={() => formEngineContextValue.onSubmit?.(formData)}
								className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
							>
								{parsedRootConfig.submitButtonText || "Submit"}
							</button>
						)}
					</div>
				)}
			</main>
		</FormEngineContextObject.Provider>
	);
}
