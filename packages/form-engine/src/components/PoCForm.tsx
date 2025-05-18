"use client";

import React, { useState, useEffect } from "react";
import { Submit, Root } from "@radix-ui/react-form";
import { FormSchema } from "../services/schemaParser";
import ComponentRenderer from "./ComponentRenderer";

interface PoCFormProps {
	schema: FormSchema;
	onSubmit?: (formData: FormDataState) => void;
}

interface FormDataState {
	[fieldId: string]: any;
}

const SESSION_STORAGE_FORM_DATA_KEY = "formEngine_formData";
const SESSION_STORAGE_PAGE_INDEX_KEY = "formEngine_currentPageIndex";

const PoCForm: React.FC<PoCFormProps> = ({ schema, onSubmit }) => {
	const [currentPageIndex, setCurrentPageIndex] = useState<number>(() => {
		// Load initial page index from session storage if available
		if (typeof window !== 'undefined') {
			const storedPageIndex = sessionStorage.getItem(SESSION_STORAGE_PAGE_INDEX_KEY);
			return storedPageIndex ? parseInt(storedPageIndex, 10) : 0;
		}
		return 0;
	});
	const [formData, setFormData] = useState<FormDataState>(() => {
		// Load initial form data from session storage if available
		if (typeof window !== 'undefined') {
			const storedFormData = sessionStorage.getItem(SESSION_STORAGE_FORM_DATA_KEY);
			return storedFormData ? JSON.parse(storedFormData) : {};
		}
		return {};
	});

	// Effect to save formData to session storage whenever it changes
	useEffect(() => {
		if (typeof window !== 'undefined') {
			sessionStorage.setItem(SESSION_STORAGE_FORM_DATA_KEY, JSON.stringify(formData));
		}
	}, [formData]);

	// Effect to save currentPageIndex to session storage whenever it changes
	useEffect(() => {
		if (typeof window !== 'undefined') {
			sessionStorage.setItem(SESSION_STORAGE_PAGE_INDEX_KEY, currentPageIndex.toString());
		}
	}, [currentPageIndex]);

	const isMultipage = schema.display === "multipage" || !schema.display;

	const handleFieldChange = (fieldId: string, value: any) => {
		setFormData((prevData) => ({
			...prevData,
			[fieldId]: value,
		}));
	};

	const handleClearFormData = () => {
		if (typeof window !== 'undefined') {
			sessionStorage.removeItem(SESSION_STORAGE_FORM_DATA_KEY);
			sessionStorage.removeItem(SESSION_STORAGE_PAGE_INDEX_KEY);
		}
		setFormData({});
		setCurrentPageIndex(0);
		// Optionally, could also add a visual confirmation or reload the page
		// window.location.reload(); // Uncomment to force a full reset if needed
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
				}
			}
		} else {
			if (onSubmit) {
				onSubmit(formData);
			} else {
				console.log("Form submitted (Singlepage PoC):", formData);
				alert("Form submitted! Check console for data.");
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
						Step {currentPageIndex + 1} of {schema.children.length}
					</p>
				)}

				<ComponentRenderer
					component={currentComponentDefinition}
					formData={formData}
					onFieldChange={handleFieldChange}
				/>

				<div className="mt-8 flex justify-between items-center">
					<div> {/* Wrapper for left-aligned buttons */}
						{currentPageIndex > 0 && (
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
							/>
						</div>
					);
				})}
				<div className="mt-8 flex justify-end items-center"> {/* Reverted to justify-end for submit */}
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

			{/* Debug Clear Button Section */}
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
