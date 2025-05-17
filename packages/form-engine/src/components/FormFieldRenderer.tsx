"use client";

import React from "react";
import * as Form from "@radix-ui/react-form";
import { FormField } from "@/services/schemaParser";
import { getFieldComponent } from "./fields";

interface FormFieldRendererProps {
	field: FormField;
	value?: any; // Current value from parent state
	onChange?: (fieldId: string, newValue: any) => void; // Callback to update parent state
}

const FormFieldRenderer: React.FC<FormFieldRendererProps> = ({ field, value, onChange }) => {
	const FieldComponent = getFieldComponent(field.type);
	const labelClassName = "text-[15px] font-medium leading-[35px] text-gray-700";
	const formMessageClassName = "text-[13px] text-red-600 opacity-[0.9]";
	const commonInputClassName = "box-border w-full bg-gray-100 shadow-sm border border-gray-300 inline-flex h-[35px] appearance-none items-center justify-center rounded-[4px] px-[10px] text-[15px] leading-none text-gray-900 outline-none hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 selection:color-white selection:bg-blue-600";

	const handleChange = (newValue: any) => {
		onChange?.(field.id, newValue);
	};

	if (!FieldComponent) {
		return <p className="text-red-500">Unsupported field type: {field.type}</p>;
	}

	// Special handling for checkbox since it includes its own label
	if (field.type === "checkbox") {
		return (
			<Form.Field name={field.id} className="mb-4 grid">
				<FieldComponent 
					field={field} 
					value={value} 
					onChange={handleChange}
				/>
				<Form.Message className={formMessageClassName} match="valueMissing">
					This field is required.
				</Form.Message>
			</Form.Field>
		);
	}

	// Special handling for radio since it has a different structure
	if (field.type === "radio") {
		return (
			<Form.Field name={field.id} className="mb-4 grid">
				<Form.Label className={labelClassName}>{field.label}</Form.Label>
				<FieldComponent 
					field={field} 
					value={value} 
					onChange={handleChange}
				/>
				<Form.Message className={formMessageClassName} match="valueMissing">
					Please select an option for {field.label.toLowerCase()}.
				</Form.Message>
			</Form.Field>
		);
	}

	// Default field rendering for most field types
	return (
		<Form.Field name={field.id} className="mb-4 grid">
			<div className="flex items-baseline justify-between">
				<Form.Label className={labelClassName}>
					{field.label}
				</Form.Label>
				<Form.Message className={formMessageClassName} match="valueMissing">
					Please enter {field.label.toLowerCase()}
				</Form.Message>
				<Form.Message className={formMessageClassName} match="typeMismatch">
					Please provide a valid {field.type === "email" ? "email address" : field.type}
				</Form.Message>
			</div>
			<FieldComponent 
				field={field} 
				value={value} 
				onChange={handleChange}
				className={commonInputClassName}
			/>
		</Form.Field>
	);
};

export default FormFieldRenderer;
