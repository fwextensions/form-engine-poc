import React from "react";
import { Control, Message } from "@radix-ui/react-form";
import type { FormField } from "../../services/schemaParser";
import type { RegisteredComponentProps } from "../componentRegistry";
import { inputStyles, messageStyles } from "./styles";
import FormFieldContainer from "./FormFieldContainer";

export default function TextField(
	props: RegisteredComponentProps)
{
	const fieldSchema = props.component as FormField;
	const { formData, onFieldChange } = props;
	const value = formData[fieldSchema.id] || "";
	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		onFieldChange(fieldSchema.id, event.target.value);
	};

	return (
		<FormFieldContainer component={fieldSchema}>
			<Control asChild>
				<input
					type={fieldSchema.type || "text"} // Type comes from schema (e.g. text, email, password)
					className={`${inputStyles} ${fieldSchema.className || ""}`}
					value={value}
					onChange={handleChange}
					required={fieldSchema.validation?.required}
					placeholder={fieldSchema.placeholder}
					disabled={fieldSchema.disabled}
					readOnly={fieldSchema.readOnly}
					autoFocus={fieldSchema.autoFocus}
					tabIndex={fieldSchema.tabIndex}
					autoComplete={fieldSchema.autoComplete}
					// style prop is applied to the outer Field container, not directly on input here
				/>
			</Control>
			<Message className={messageStyles} name={fieldSchema.id} match="valueMissing">
				{fieldSchema.label || "This field"} is required
			</Message>
		</FormFieldContainer>
	);
}
