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

				<div className="mt-8 flex justify-between items-center">
					<div>
						{isClient && currentPageIndex > 0 && (
							<button
								type="button"
								onClick={handlePrevious}
								className="box-border text-gray-700 bg-gray-200 hover:bg-gray-300 focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 focus:outline-none mr-2"
							>
								Previous
							</button>
						)}
					</div>

					<Submit asChild>
						<button
							className="box-border text-white touch-manipulation bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 focus:outline-none"
						>
							{isLastStep ? "Submit (PoC)" : "Next"}
						</button>
					</Submit>
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
				<div className="mt-8 flex justify-end items-center">
					<Submit asChild>
						<button
							className="box-border text-white touch-manipulation bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 focus:outline-none"
						>
							Submit (PoC)
						</button>
					</Submit>
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

			<div className="mt-10 pt-6 border-t border-gray-300 flex justify-center">
				<button
					type="button"
					onClick={handleClearFormData}
					className="box-border text-sm text-red-700 bg-red-100 hover:bg-red-200 focus:ring-4 focus:ring-red-300 font-medium rounded-lg px-4 py-2 focus:outline-none"
				>
					Clear Form
				</button>
			</div>
		</Root>
	);
};

export default PoCForm;
