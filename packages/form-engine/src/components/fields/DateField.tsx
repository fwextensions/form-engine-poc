import React, { useState, useEffect, useCallback } from "react";
import { Control, Message } from "@radix-ui/react-form";
import type { FormField } from "../../services/schemaParser";
import type { RegisteredComponentProps } from "../componentRegistry";
import { inputStyles, messageStyles, transition } from "./styles";
import FormFieldContainer from "./FormFieldContainer";

export default function DateField(props: RegisteredComponentProps) {
	const fieldSchema = props.component as FormField;
	const { formData, onFieldChange, component } = props;

	const [month, setMonth] = useState("");
	const [day, setDay] = useState("");
	const [year, setYear] = useState("");

	const reconstructDate = useCallback(() => {
		if (year && month && day) {
			const formattedMonth = month.padStart(2, "0");
			const formattedDay = day.padStart(2, "0");
			// Basic validation for length, more complex date validation could be added
			if (year.length === 4 && formattedMonth.length === 2 && formattedDay.length === 2) {
				onFieldChange(fieldSchema.id, `${year}-${formattedMonth}-${formattedDay}`);
			} else {
				// If parts are filled but not forming a valid structure, clear the main form value
				onFieldChange(fieldSchema.id, "");
			}
		} else if (!year && !month && !day) {
			// If all fields are empty, clear the main form value
			onFieldChange(fieldSchema.id, "");
		} else {
			// If some fields are filled but not all, treat as incomplete, clear main form value
			onFieldChange(fieldSchema.id, "");
		}
	}, [year, month, day, fieldSchema.id, onFieldChange]);

	useEffect(() => {
		const currentDateValue = formData[fieldSchema.id] as string | undefined;
		if (currentDateValue && typeof currentDateValue === "string") {
			const parts = currentDateValue.split("-");
			if (parts.length === 3) {
				const [y, m, d] = parts;
				if (y.length === 4 && m.length === 2 && d.length === 2) {
					setYear(y);
					setMonth(m);
					setDay(d);
					return; // Exit early if valid date is parsed
				}
			}
		}
		// If no valid date string or parsing fails, ensure local state is clear
		// only if the form data itself is also empty, to avoid clearing user input prematurely
		if (!currentDateValue) {
			setMonth("");
			setDay("");
			setYear("");
		}
	}, [formData[fieldSchema.id]]);

	useEffect(() => {
		reconstructDate();
	}, [month, day, year, reconstructDate]);

	const handleInputChange = (
		setter: React.Dispatch<React.SetStateAction<string>>,
		maxLength: number,
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const { value } = event.target;
		// Allow only numbers and ensure maxLength
		if (/^\d*$/.test(value) && value.length <= maxLength) {
			setter(value);
		}
	};

	return (
		<FormFieldContainer component={fieldSchema}>
			{/* Use a div to group the inputs and apply Control to it if needed, or individual Controls */}
			{/* For Radix Form, Control should wrap the actual input elements. 
			   Since we have multiple, we'll wrap each or a conceptual group. 
			   Here, we'll make the div a common parent and not use Control directly on it,
			   as Control expects a single input child typically. Validation will be on the hidden combined field.
			*/}
			<div className="flex space-x-2">
				<Control asChild>
					<input
						type="text"
						name={`${fieldSchema.id}-month`}
						aria-label={`${fieldSchema.label || "Date"} - Month`}
						className={`${inputStyles} ${transition} w-16 text-center ${component.className || ""}`}
						value={month}
						onChange={(e) => handleInputChange(setMonth, 2, e)}
						placeholder="MM"
						maxLength={2}
						required={fieldSchema.validation?.required}
						disabled={fieldSchema.disabled}
						readOnly={fieldSchema.readOnly}
						autoFocus={fieldSchema.autoFocus} // AutoFocus only on the first part
						tabIndex={fieldSchema.tabIndex}
					/>
				</Control>
				<Control asChild>
					<input
						type="text"
						name={`${fieldSchema.id}-day`}
						aria-label={`${fieldSchema.label || "Date"} - Day`}
						className={`${inputStyles} ${transition} w-16 text-center ${component.className || ""}`}
						value={day}
						onChange={(e) => handleInputChange(setDay, 2, e)}
						placeholder="DD"
						maxLength={2}
						required={fieldSchema.validation?.required}
						disabled={fieldSchema.disabled}
						readOnly={fieldSchema.readOnly}
						tabIndex={fieldSchema.tabIndex ? fieldSchema.tabIndex + 1 : undefined}
					/>
				</Control>
				<Control asChild>
					<input
						type="text"
						name={`${fieldSchema.id}-year`}
						aria-label={`${fieldSchema.label || "Date"} - Year`}
						className={`${inputStyles} ${transition} w-24 text-center ${component.className || ""}`}
						value={year}
						onChange={(e) => handleInputChange(setYear, 4, e)}
						placeholder="YYYY"
						maxLength={4}
						required={fieldSchema.validation?.required}
						disabled={fieldSchema.disabled}
						readOnly={fieldSchema.readOnly}
						tabIndex={fieldSchema.tabIndex ? fieldSchema.tabIndex + 2 : undefined}
					/>
				</Control>
			</div>
			{/* Radix Form Message will refer to the main fieldSchema.id for validation errors */}
			<Message className={messageStyles} name={fieldSchema.id} match="valueMissing">
				{fieldSchema.label || "This date"} is required
			</Message>
			{/* TODO: Add more specific validation messages if needed, e.g., for invalid date format */}
		</FormFieldContainer>
	);
}
