import React from "react";
import { Message, Label } from "@radix-ui/react-form";
import * as Checkbox from "@radix-ui/react-checkbox";
import { CheckIcon } from "@radix-ui/react-icons";
import type { FormField } from "../../services/schemaParser";
import type { RegisteredComponentProps } from "../componentRegistry";
import { messageStyles, labelStyles, borderRadius, focusRing, transition } from "./styles";
import FormFieldContainer from "./FormFieldContainer";

export default function CheckboxField(
	props: RegisteredComponentProps)
{
	const fieldSchema = props.component as FormField;
	const { formData, onFieldChange } = props;

	// we don't want to pass the label to the FormFieldContainer, because the label
	// should be to the right of the checkbox, not above it
	const { label, ...componentWithoutLabel } = fieldSchema;

	// Checkbox value should be boolean. Default to false if undefined.
	const checked = formData[fieldSchema.id] === true;

	const handleCheckedChange = (newCheckedState: Checkbox.CheckedState) => {
		// Radix onCheckedChange returns boolean or 'indeterminate'. We only care about boolean.
		onFieldChange(fieldSchema.id, newCheckedState === true);
	};

	return (
		<FormFieldContainer component={componentWithoutLabel}>
			<div className="flex items-center space-x-2.5">
				<Checkbox.Root
					id={fieldSchema.id} // Link checkbox to its label
					className={`peer h-5 w-5 shrink-0 ${borderRadius} border border-gray-300 ${focusRing} ${transition} disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white data-[state=checked]:border-blue-600 ${fieldSchema.className || ""}`}
					checked={checked}
					onCheckedChange={handleCheckedChange}
					required={fieldSchema.validation?.required}
					disabled={fieldSchema.disabled}
					autoFocus={fieldSchema.autoFocus}
					tabIndex={fieldSchema.tabIndex}
					// style prop is applied to the outer Field container
				>
					<Checkbox.Indicator className="flex items-center justify-center text-current">
						<CheckIcon className="h-5 w-5" />
					</Checkbox.Indicator>
				</Checkbox.Root>
				{label && (
					<Label htmlFor={fieldSchema.id} className={`${labelStyles} !mb-0 font-normal cursor-pointer`}>
						{label}
					</Label>
				)}
			</div>
			{/* Radix Form Message for checkbox often requires a bit more setup if specific messages are needed beyond 'required' for a boolean */}
			{fieldSchema.validation?.required && (
				<Message className={messageStyles} name={fieldSchema.id} match={(value) => {
					switch (typeof value) {
						case "boolean":
							return !value; // Show message if boolean value is false
						case "string":
							// Show message if string value (case-insensitive) is not "true"
							return value.toLowerCase() !== "true";
						default:
							// For undefined, null, or other types, consider it "not checked"
							return true;
					}
				}}>
					{fieldSchema.label || "This checkbox"} must be checked.
				</Message>
			)}
		</FormFieldContainer>
	);
}
