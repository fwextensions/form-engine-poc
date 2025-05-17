"use client";

import React, { useState } from "react";
import * as Form from "@radix-ui/react-form";
import { FormSchema, PageComponentDefinition, FormField } from "@/services/schemaParser";
import FormFieldRenderer from "./FormFieldRenderer";

interface PoCFormProps {
	schema: FormSchema;
}

interface FormDataState {
	[fieldId: string]: any;
}

const PoCForm: React.FC<PoCFormProps> = ({ schema }) => {
	const [currentPageIndex, setCurrentPageIndex] = useState(0);
	const [formData, setFormData] = useState<FormDataState>({});

	const currentPage: PageComponentDefinition = schema.children[currentPageIndex];
	const isLastStep = currentPageIndex === schema.children.length - 1;

	const handleFieldChange = (
		fieldId: string,
		value: any) => {
		setFormData((prevData) => ({
			...prevData,
			[fieldId]: value,
		}));
	};

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!isLastStep) {
			setCurrentPageIndex((prev) => prev + 1);
		} else {
			console.log("Form submitted (PoC):", formData);
		}
	};

	const handlePrevious = () => {
		setCurrentPageIndex((prev) => Math.max(0, prev - 1));
	};

	return (
		<Form.Root
			key={currentPageIndex}
			className="w-[calc(100%-20px)] max-w-[600px] mx-auto my-5 p-5 bg-white shadow-lg rounded-md"
			onSubmit={handleSubmit}
		>
			<h1 className="text-2xl font-bold mb-2 text-center text-gray-800">
				{schema.title}
			</h1>
			{currentPage.title && (
				<h2 className="text-xl font-semibold mb-6 text-center text-gray-700">
					{currentPage.title} (Step {currentPageIndex +
					1} of {schema.children.length})
				</h2>
			)}
			{!currentPage.title && (
				<p className="text-md mb-6 text-center text-gray-600">
					Step {currentPageIndex + 1} of {schema.children.length}
				</p>
			)}

			{currentPage.children.map((field: FormField) => (
				<FormFieldRenderer
					key={field.id}
					field={field}
					value={formData[field.id]}
					onChange={handleFieldChange}
				/>
			))}

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

				<Form.Submit asChild>
					<button
						className="box-border text-white touch-manipulation bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 focus:outline-none"
					>
						{isLastStep ? "Submit (PoC)" : "Next"}
					</button>
				</Form.Submit>
			</div>
		</Form.Root>
	);
};

export default PoCForm;
