"use client";

import React, { useState } from "react";
import * as Form from "@radix-ui/react-form";
import { FormSchema, FormStep, FormField } from "@/services/schemaParser"; 
import FormFieldRenderer from "./FormFieldRenderer";

interface PoCFormProps {
	schema: FormSchema;
}

interface FormDataState {
	[fieldId: string]: any; 
}

const PoCForm: React.FC<PoCFormProps> = ({ schema }) => {
	const [currentStepIndex, setCurrentStepIndex] = useState(0);
	const [formData, setFormData] = useState<FormDataState>({}); 

	const currentStep: FormStep = schema.steps[currentStepIndex];
	const isLastStep = currentStepIndex === schema.steps.length - 1;

	const handleFieldChange = (fieldId: string, value: any) => {
		setFormData((prevData) => ({
			...prevData,
			[fieldId]: value,
		}));
	};

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault(); 

		if (!isLastStep) {
			setCurrentStepIndex((prev) => prev + 1);
		} else {
			console.log("Form submitted (PoC):", formData);
		}
	};

	const handlePrevious = () => {
		setCurrentStepIndex((prev) => Math.max(0, prev - 1));
	};

	return (
		<Form.Root
			key={currentStepIndex} // Add this key to reset form state on step change
			className="w-[calc(100%-20px)] max-w-[600px] mx-auto my-5 p-5 bg-white shadow-lg rounded-md"
			onSubmit={handleSubmit}
		>
			<h1 className="text-2xl font-bold mb-2 text-center text-gray-800">
				{schema.formName}
			</h1>
			{currentStep.title && (
				<h2 className="text-xl font-semibold mb-6 text-center text-gray-700">
					{currentStep.title} (Step {currentStepIndex + 1} of {schema.steps.length})
				</h2>
			)}
			{!currentStep.title && (
				<p className="text-md mb-6 text-center text-gray-600">
					Step {currentStepIndex + 1} of {schema.steps.length}
				</p>
			)}

			{currentStep.fields.map((field: FormField) => (
				<FormFieldRenderer
					key={field.id}
					field={field}
					value={formData[field.id]} 
					onChange={handleFieldChange} 
				/>
			))}

			<div className="mt-8 flex justify-between items-center">
				{currentStepIndex > 0 && (
					<button
						type="button"
						onClick={handlePrevious}
						className="box-border text-gray-700 bg-gray-200 hover:bg-gray-300 focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 focus:outline-none"
					>
						Previous
					</button>
				)}
				{currentStepIndex === 0 && <div />}

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
