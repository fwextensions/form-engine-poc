import React from "react";
import { Control, Message } from "@radix-ui/react-form";
import type { RegisteredComponentProps } from "../componentRegistry";
import { inputStyles, messageStyles, transition } from "./styles";
import FormFieldContainer from "./FormFieldContainer";

export default function TextareaField(props: RegisteredComponentProps) {
	const { component, formData, onFieldChange } = props;

	// Type guard to ensure this is a textarea field
	if (component.type !== "textarea") {
		console.error(
			`TextareaField received a component of type '${component.type}' (id: ${component.id}). Expected 'textarea'.`,
		);
		return null; // Or render a more user-friendly error
	}

	// Now TypeScript knows 'component' is specifically the textarea field type,
	// so 'component.rows' is guaranteed to exist (if defined in the schema for textarea).

	const value = formData[component.id] || "";
	const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		onFieldChange(component.id, event.target.value);
	};

	return (
		<FormFieldContainer component={component}>
			<Control asChild>
				<textarea
					className={`${inputStyles} ${transition} ${component.className || ""}`}
					value={value}
					onChange={handleChange}
					required={component.validation?.required}
					placeholder={component.placeholder}
					disabled={component.disabled}
					readOnly={component.readOnly}
					autoFocus={component.autoFocus}
					tabIndex={component.tabIndex}
					rows={component.rows}
				/>
			</Control>
			<Message className={messageStyles} name={component.id} match="valueMissing">
				{component.label || "This field"} is required
			</Message>
			{/* TODO: Add other validation messages here if needed */}
		</FormFieldContainer>
	);
}
