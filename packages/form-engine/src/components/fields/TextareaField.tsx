import React from "react";
import { Control, Message } from "@radix-ui/react-form";
import type { FormField } from "../../services/schemaParser";
import type { RegisteredComponentProps } from "../componentRegistry";
import { inputStyles, messageStyles } from "./styles";
import FormFieldContainer from "./FormFieldContainer";

export default function TextareaField(props: RegisteredComponentProps) {
	const fieldSchema = props.component as FormField;
	const { formData, onFieldChange } = props;

	const value = formData[fieldSchema.id] || "";
	const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		onFieldChange(fieldSchema.id, event.target.value);
	};

	return (
		<FormFieldContainer component={fieldSchema}>
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
				/>
			</Control>
			<Message className={messageStyles} name={fieldSchema.id} match="valueMissing">
				{fieldSchema.label || "This field"} is required
			</Message>
			{/* TODO: Add other validation messages here if needed */}
		</FormFieldContainer>
	);
}
