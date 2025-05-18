"use client";

import React, { useState } from "react";
import { Submit, Root } from "@radix-ui/react-form";
import { FormSchema } from "../services/schemaParser";
import ComponentRenderer from "./ComponentRenderer";

interface PoCFormProps {
	schema: FormSchema;
}

interface FormDataState {
	[fieldId: string]: any;
}

const PoCForm: React.FC<PoCFormProps> = ({ schema }) => {
	const [currentPageIndex, setCurrentPageIndex] = useState(0);
	const [formData, setFormData] = useState<FormDataState>({});

	const isMultipage = schema.display === "multipage" || !schema.display;

	const handleFieldChange = (fieldId: string, value: any) => {
		setFormData((prevData) => ({
			...prevData,
			[fieldId]: value,
		}));
	};

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (isMultipage) {
			const isLastStep = currentPageIndex === schema.children.length - 1;
			if (!isLastStep) {
				setCurrentPageIndex((prev) => prev + 1);
			} else {
				console.log("Form submitted (Multipage PoC):", formData);
				// TODO: Call an onSubmit prop if passed, e.g., schema.onSubmit(formData)
			}
		} else {
			console.log("Form submitted (Singlepage PoC):", formData);
			// TODO: Call an onSubmit prop if passed
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
					{currentPageIndex > 0 && (
						<button
							type="button"
							onClick={handlePrevious}
							className="box-border text-gray-700 bg-gray-200 hover:bg-gray-300 focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 focus:outline-none"
						>
							Previous
						</button>
					)}
					{currentPageIndex === 0 && <div />}

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
		</Root>
	);
};

export default PoCForm;
