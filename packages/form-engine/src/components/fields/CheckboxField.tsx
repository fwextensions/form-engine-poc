import React from "react";
import { Message, Label } from "@radix-ui/react-form";
import * as Checkbox from "@radix-ui/react-checkbox";
import { CheckIcon } from "@radix-ui/react-icons";
import type { FormField } from "../../services/schemaParser";
import type { RegisteredComponentProps } from "../componentRegistry";
import { messageStyles, labelStyles } from "./styles";
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
			<div className="flex items-center space-x-2">
				<Checkbox.Root
					id={fieldSchema.id} // Link checkbox to its label
					className={`peer h-5 w-5 shrink-0 rounded-sm border border-slate-300 shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white ${fieldSchema.className ||
						""}`}
					checked={checked}
					onCheckedChange={handleCheckedChange}
					required={fieldSchema.validation?.required}
					disabled={fieldSchema.disabled}
					autoFocus={fieldSchema.autoFocus}
					tabIndex={fieldSchema.tabIndex}
					// style prop is applied to the outer Field container
				>
					<Checkbox.Indicator className="flex items-center justify-center text-current">
						<CheckIcon className="h-4 w-4" />
					</Checkbox.Indicator>
				</Checkbox.Root>
				{label && (
					<Label htmlFor={fieldSchema.id} className={`${labelStyles} cursor-pointer`}>
						{label}
					</Label>
				)}
			</div>
			{/* Radix Form Message for checkbox often requires a bit more setup if specific messages are needed beyond 'required' for a boolean */}
			{fieldSchema.validation?.required && (
				<Message className={messageStyles} name={fieldSchema.id} match={(value) => value !== "true"}>
					{fieldSchema.label || "This checkbox"} must be checked.
				</Message>
			)}
		</FormFieldContainer>
	);
}
