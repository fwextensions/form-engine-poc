"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
	DynamicRenderer,
	FormEngineContextObject,
	parseRootFormSchema,
	FormConfig, 
	FormEngineContext
} from "form-engine";
import { z } from "zod";
import schemaData from "@/schemas/poc-simple-form.yaml";
import { useRouter } from "next/navigation";

export default function HomePage() {
	const router = useRouter();

	const [parsedRootConfig, setParsedRootConfig] = useState<FormConfig | null>(null);
	const [schemaErrors, setSchemaErrors] = useState<z.ZodFormattedError<unknown> | null>(null);
	const [formData, setFormData] = useState<Record<string, unknown>>({});
	const [isClient, setIsClient] = useState(false);
	const [currentPageIndex, setCurrentPageIndex] = useState(0);
	const [isMultiPageFromToggle, setIsMultiPageFromToggle] = useState(true); 

	useEffect(() => {
		setIsClient(true);
		const result = parseRootFormSchema(schemaData);
		if (result.config) {
			setParsedRootConfig(result.config as FormConfig);
			setSchemaErrors(null);
		} else if (result.errors) {
			console.error("Schema parsing errors:", result.errors.flatten());
			setParsedRootConfig(null);
			setSchemaErrors(result.errors.format());
		}
	}, []);

	const pageComponents = React.useMemo(() => {
		if (parsedRootConfig && parsedRootConfig.type === "form" && Array.isArray(parsedRootConfig.children)) {
			return parsedRootConfig.children.filter(child => child.type === "page");
		}
		return [];
	}, [parsedRootConfig]);

	const totalPages = pageComponents.length;
	const actualIsMultiPage = isMultiPageFromToggle && totalPages > 1;

	const handleNextPage = useCallback(() => {
		if (currentPageIndex < totalPages - 1) {
			setCurrentPageIndex(currentPageIndex + 1);
		}
	}, [currentPageIndex, totalPages]);

	const handlePrevPage = () => {
		if (currentPageIndex > 0) {
			setCurrentPageIndex(currentPageIndex - 1);
		}
	};

	const handleToggleMultiPage = (event: React.ChangeEvent<HTMLInputElement>) => {
		setIsMultiPageFromToggle(event.target.checked);
		setCurrentPageIndex(0); 
	};

	const initialContext = {
		listingId: "listing-123-abc",
		userRole: "applicant",
	};

	const handleFinalSubmit = (submittedFormData: Record<string, unknown>) => {
		console.log("Form submitted:", submittedFormData);
		const stringifiedData: Record<string, string> = {};
		for (const key in submittedFormData) {
			if (Object.prototype.hasOwnProperty.call(submittedFormData, key)) {
				const value = submittedFormData[key];
				if (value !== null && value !== undefined) {
					stringifiedData[key] = String(value);
				} else {
					stringifiedData[key] = "";
				}
			}
		}
		const queryParams = new URLSearchParams(stringifiedData).toString();
		router.push(`/submission?${queryParams}`);
	};

	const handleDataChange = useCallback((fieldName: string, value: unknown) => {
		setFormData((prevData) => ({ ...prevData, [fieldName]: value }));
	}, []);

	const formEngineContextValue: FormEngineContext = {
		formData,
		onDataChange: handleDataChange,
		formContext: initialContext,
		formMode: "edit",
		onSubmit: handleFinalSubmit, 
		isMultiPage: actualIsMultiPage,
		currentPageIndex: actualIsMultiPage ? currentPageIndex : undefined,
		totalPages: actualIsMultiPage ? totalPages : undefined,
		onNavigateNext: actualIsMultiPage ? handleNextPage : undefined,
		onNavigatePrev: actualIsMultiPage ? handlePrevPage : undefined,
	};

	const configToRender = parsedRootConfig;

	if (!configToRender) {
		return (
			<main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-100">
				<div className="text-gray-700 font-bold text-xl">
					Loading form or schema invalid...
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
								checked={isMultiPageFromToggle} 
								onChange={handleToggleMultiPage}
								className="form-checkbox h-5 w-5 text-indigo-600"
							/>
							<span>Navigate pages one by one</span>
						</label>
						{actualIsMultiPage && (
							<p className="text-sm text-gray-600 mt-1">
								Page {currentPageIndex + 1} of {totalPages}
							</p>
						)}
					</div>
				)}

				<div className="w-full max-w-3xl mx-auto bg-white p-6 md:p-8 rounded-lg shadow-md">
					<DynamicRenderer config={configToRender} context={formEngineContextValue} /> 
				</div>

			</main>
		</FormEngineContextObject.Provider>
	);
}
