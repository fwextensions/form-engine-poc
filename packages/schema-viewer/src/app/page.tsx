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

	// The imported schemaData is already a JavaScript object thanks to yaml-loader
	// Parse the schema using the new parseRootFormSchema
	useEffect(() => {
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

	if (!parsedRootConfig) {
		return (
			<main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-100">
				<div className="text-gray-700 font-bold text-xl">
					Loading form schema...
				</div>
			</main>
		);
	}

	return (
		<FormEngineContextObject.Provider value={formEngineContextValue}>
			<main className="flex min-h-screen flex-col items-start justify-start p-5 md:p-8 lg:p-12 bg-gray-100">
				{/* Render the DynamicRenderer with the parsed root config and context */}
				<DynamicRenderer config={parsedRootConfig} context={formEngineContextValue} />
			</main>
		</FormEngineContextObject.Provider>
	);
}
