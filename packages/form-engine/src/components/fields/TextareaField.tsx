import React from "react";
import { Control, Field, Label, Message } from "@radix-ui/react-form";
import type { FormField } from "../../services/schemaParser"; 
import type { RegisteredComponentProps } from "../componentRegistry"; 
import { inputStyles, labelStyles, formMessageStyles } from "./styles"; // Ensure inputStyles is appropriate or a textarea specific one is used

export default function TextareaField(props: RegisteredComponentProps) {
	const fieldSchema = props.component as FormField;
	const { formData, onFieldChange } = props;

	const value = formData[fieldSchema.id] || "";
	const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		onFieldChange(fieldSchema.id, event.target.value);
	};

	return (
		<Field
			name={fieldSchema.id}
			className={`mb-4 grid ${fieldSchema.className || ""}`}
			style={fieldSchema.style}
		>
			<div className="flex items-baseline justify-between">
				{fieldSchema.label && (
					<Label className={labelStyles}>
						{fieldSchema.label}
					</Label>
				)}
				<Message className={formMessageStyles} name={fieldSchema.id} match="valueMissing">
					{fieldSchema.label || "This field"} is required
				</Message>
				{/* TODO: Add other validation messages here if needed */}
			</div>
			<Control asChild>
				<textarea
					className={`${inputStyles} ${fieldSchema.className || ""}`}
					value={value}
					onChange={handleChange}
					required={fieldSchema.validation?.required}
					placeholder={fieldSchema.placeholder}
					disabled={fieldSchema.disabled}
					readOnly={fieldSchema.readOnly}
					autoFocus={fieldSchema.autoFocus}
					tabIndex={fieldSchema.tabIndex}
					rows={fieldSchema.rows}
					// style prop is applied to the outer Field container
				/>
			</Control>
			{fieldSchema.description && (
				<div className="mt-1 text-sm text-gray-500">
					{fieldSchema.description}
				</div>
			)}
		</Field>
	);
}
