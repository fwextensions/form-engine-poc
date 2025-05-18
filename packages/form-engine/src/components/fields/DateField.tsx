import React from "react";
import { Control, Field, Label, Message } from "@radix-ui/react-form";
import { FormField } from "../../services/schemaParser";
import { RegisteredComponentProps } from "../componentRegistry";
import { inputStyles, labelStyles, formMessageStyles } from "./styles";

const DateFieldWrapper: React.FC<RegisteredComponentProps> = (props) => {
	const fieldSchema = props.component as FormField;
	const { formData, onFieldChange } = props;

	const value = formData[fieldSchema.id] || ""; // Date input expects YYYY-MM-DD string
	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
				{/* TODO: Add other validation messages here if needed (e.g., typeMismatch for invalid date) */}
			</div>
			<Control asChild>
				<input
					type="date" // Explicitly set type to date
					className={`${inputStyles} ${fieldSchema.className || ""}`}
					value={value}
					onChange={handleChange}
					required={fieldSchema.validation?.required}
					placeholder={fieldSchema.placeholder} // Placeholder might not be very effective for date type
					disabled={fieldSchema.disabled}
					readOnly={fieldSchema.readOnly}
					autoFocus={fieldSchema.autoFocus}
					tabIndex={fieldSchema.tabIndex}
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
};

export default DateFieldWrapper;
