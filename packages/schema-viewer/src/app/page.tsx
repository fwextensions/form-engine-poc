"use client";

import React, { useState, useEffect } from "react";
import { z } from "zod";
import { FormConfig, parseRootFormSchema, FormEngine } from "form-engine";
import schemaData from "@/schemas/poc-simple-form.yaml";
import { useRouter } from "next/navigation";

export default function HomePage() {
	const router = useRouter();

	const [parsedRootConfig, setParsedRootConfig] = useState<FormConfig | null>(null);
	const [schemaErrors, setSchemaErrors] = useState<z.ZodFormattedError<unknown> | null>(null);
	const [isClient, setIsClient] = useState(false);

	// State for the controlled component pattern
	const [currentPage, setCurrentPage] = useState(0);
	const [totalPages, setTotalPages] = useState(0);
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

	const handleToggleMultiPage = (event: React.ChangeEvent<HTMLInputElement>) => {
		setIsMultiPageFromToggle(event.target.checked);
		setCurrentPage(0); // Reset to first page when toggling
	};

	const handleFinalSubmit = (submittedFormData: Record<string, unknown>) => {
		console.log("Form submitted from Schema Viewer:", submittedFormData);

		// Navigate to a submission page with query params
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

	const handlePageChange = (pageIndex: number, total: number) => {
		console.log(`Page changed to ${pageIndex + 1} of ${total}`);
		setCurrentPage(pageIndex);
		setTotalPages(total);
	};

	if (!parsedRootConfig) {
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

	const actualIsMultiPage = isMultiPageFromToggle && totalPages > 1;

	return (
		<main className="flex min-h-screen flex-col items-start justify-start p-5 md:p-8 lg:p-12 bg-gray-100 w-full">
			{isClient && totalPages > 1 && (
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
							Page {currentPage + 1} of {totalPages}
						</p>
					)}
				</div>
			)}

			<div className="w-full max-w-3xl mx-auto bg-white p-6 md:p-8 rounded-lg shadow-md">
				<FormEngine
					schema={parsedRootConfig}
					formContext={{
						listingId: "listing-123-abc",
						userRole: "applicant",
					}}
					displayMode={isMultiPageFromToggle ? "multipage" : "singlepage"}
					currentPage={currentPage}
					onSubmit={handleFinalSubmit}
					onPageChange={handlePageChange}
				/>
			</div>
		</main>
	);
}
