"use client";

import React, { useState, useEffect } from "react";
import { Submit, Root } from "@radix-ui/react-form";
import type { FormSchema } from "../services/schemaParser";
import ComponentRenderer from "./ComponentRenderer";

interface PoCFormProps {
	schema: FormSchema;
	context?: Record<string, any>;
	onSubmit?: (formData: FormDataState) => void;
}

interface FormDataState {
	[fieldId: string]: any;
}

const SESSION_STORAGE_FORM_DATA_KEY = "formEngine_formData";
const SESSION_STORAGE_PAGE_INDEX_KEY = "formEngine_currentPageIndex";

const SaveAndFinishLater = () => (
	<a
		href="#"
		onClick={(e) => {
			e.preventDefault();
			console.log("Save and finish later clicked (Multipage)");
			// TODO: Implement actual save logic here if needed
		}}
		className={`${linkStyles} block text-center`}
	>
		Save and finish later
	</a>
);

// Button and Link Styles
const primaryButtonStyles = "text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-offset-1 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors duration-150";
const secondaryButtonStyles = "text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-4 focus:ring-offset-1 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors duration-150";
const linkStyles = "text-blue-600 hover:text-blue-700 hover:underline text-sm font-medium transition-colors duration-150";

const PoCForm: React.FC<PoCFormProps> = ({ schema, context = {}, onSubmit }) => {
	const [currentPageIndex, setCurrentPageIndex] = useState<number>(0); // Initial render always 0
	const [formData, setFormData] = useState<FormDataState>({}); // Initial render always empty
	const [isClient, setIsClient] = useState(false); // Flag to ensure sessionStorage access only on client

	// Effect to set isClient to true after mount, and load initial state from session storage
	useEffect(() => {
		setIsClient(true);

		const storedPageIndex = sessionStorage.getItem(SESSION_STORAGE_PAGE_INDEX_KEY);
		if (storedPageIndex) {
			setCurrentPageIndex(parseInt(storedPageIndex, 10));
		}

		const storedFormData = sessionStorage.getItem(SESSION_STORAGE_FORM_DATA_KEY);
		if (storedFormData) {
			setFormData(JSON.parse(storedFormData));
		}
	}, []); // Empty dependency array ensures this runs once on mount (client-side)

	// Effect to save formData to session storage whenever it changes
	useEffect(() => {
		if (isClient) { // Only run on client
			sessionStorage.setItem(SESSION_STORAGE_FORM_DATA_KEY, JSON.stringify(formData));
		}
	}, [formData, isClient]);

	// Effect to save currentPageIndex to session storage whenever it changes
	useEffect(() => {
		if (isClient) { // Only run on client
			sessionStorage.setItem(SESSION_STORAGE_PAGE_INDEX_KEY, currentPageIndex.toString());
		}
	}, [currentPageIndex, isClient]);

	const isMultipage = schema.display === "multipage" || !schema.display;

	const handleFieldChange = (fieldId: string, value: any) => {
		setFormData((prevData) => ({
			...prevData,
			[fieldId]: value,
		}));
	};

	const handleClearFormData = () => {
		if (isClient) { // Only run on client
			sessionStorage.removeItem(SESSION_STORAGE_FORM_DATA_KEY);
			sessionStorage.removeItem(SESSION_STORAGE_PAGE_INDEX_KEY);
		}
		setFormData({});
		setCurrentPageIndex(0);
	};

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (isMultipage) {
			const isLastStep = currentPageIndex === schema.children.length - 1;
			if (!isLastStep) {
				setCurrentPageIndex((prev) => prev + 1);
			} else {
				if (onSubmit) {
					onSubmit(formData);
				} else {
					console.log("Form submitted (Multipage PoC):", formData);
					alert("Form submitted! Check console for data.");
					// Optionally clear data on final submit
					// handleClearFormData();
				}
			}
		} else {
			if (onSubmit) {
				onSubmit(formData);
			} else {
				console.log("Form submitted (Singlepage PoC):", formData);
				alert("Form submitted! Check console for data.");
				// Optionally clear data on final submit
				// handleClearFormData();
			}
		}
	};

	const handlePrevious = () => {
		if (isMultipage) {
			setCurrentPageIndex((prev) => Math.max(0, prev - 1));
		}
	};

	const renderMultipageFormContent = () => {
		const currentComponentDefinition = schema.children[currentPageIndex];
		if (!currentComponentDefinition || currentComponentDefinition.type !== "page") {
			console.error(
				"Multipage display expects a 'page' component at the current index.",
				currentComponentDefinition,
			);
			return <div>Error: Invalid component for multipage step.</div>;
		}
		const isLastStep = currentPageIndex === schema.children.length - 1;

		return (
			<>
				{schema.children.length > 1 && (
					<p className="text-base mb-4 text-center text-gray-600">
						Step {isClient ? currentPageIndex + 1 : 1} of {schema.children.length}
					</p>
				)}

				<ComponentRenderer
					component={currentComponentDefinition}
					formData={formData}
					onFieldChange={handleFieldChange}
					context={context}
				/>

				<div className="mt-8 space-y-4"> {/* Outer container for buttons and link */}
					<div className={`flex items-center ${isClient && currentPageIndex > 0 ? 'justify-between' : 'justify-end'}`}>
						{isClient && currentPageIndex > 0 && (
							<button
								type="button"
								onClick={handlePrevious}
								className={secondaryButtonStyles}
							>
								Previous
							</button>
						)}
						<Submit asChild>
							<button
								className={primaryButtonStyles}
							>
								{isLastStep ? "Submit" : "Next"}
							</button>
						</Submit>
					</div>
					<SaveAndFinishLater />
				</div>
			</>
		);
	};

	const renderSinglepageFormContent = () => {
		return (
			<>
				{schema.children.map((componentDefinition, index) => {
					if (componentDefinition.type !== "page") {
						console.warn(
							"Singlepage display encountered a non-page component at the top level. Rendering it directly.",
							componentDefinition,
						);
					}
					return (
						<div
							key={componentDefinition.id || index}
							className={index > 0 ? "mt-8 pt-6 border-t border-gray-200" : ""}
						>
							<ComponentRenderer
								component={componentDefinition}
								formData={formData}
								onFieldChange={handleFieldChange}
								context={context}
							/>
						</div>
					);
				})}
				<div className="mt-8 space-y-4"> {/* Outer container for button and link */}
					<div className="flex justify-end items-center"> {/* Submit button to the right */}
						<Submit asChild>
							<button
								className={primaryButtonStyles}
							>
								Submit
							</button>
						</Submit>
					</div>
					<SaveAndFinishLater />
				</div>
			</>
		);
	};

	return (
		<Root
			key={isMultipage ? schema.children[currentPageIndex]?.id || currentPageIndex : "singlepage-form"}
			className="w-[calc(100%-20px)] max-w-[600px] mx-auto my-3 p-5 bg-white shadow-lg rounded-md"
			onSubmit={handleSubmit}
		>
			{schema.title && (
				<h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
					{schema.title}
				</h1>
			)}

			{isMultipage ? renderMultipageFormContent() : renderSinglepageFormContent()}

			{isClient && process.env.NODE_ENV === "development" && (
				<div className="mt-8 text-center">
					<button
						type="button"
						onClick={handleClearFormData}
						className="text-xs text-red-500 hover:text-red-700 hover:underline"
					>
						Clear Form Data (Dev only)
					</button>
				</div>
			)}
		</Root>
	);
};

export default PoCForm;
