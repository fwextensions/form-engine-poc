import React from "react";
import { Field, Label, Message } from "@radix-ui/react-form";
import * as Checkbox from "@radix-ui/react-checkbox";
import { CheckIcon } from "@radix-ui/react-icons";
import { FormField } from "../../services/schemaParser";
import { RegisteredComponentProps } from "../componentRegistry";
import { labelStyles, formMessageStyles } from "./styles";

export default function CheckboxField(props: RegisteredComponentProps) {
	const fieldSchema = props.component as FormField;
	const { formData, onFieldChange } = props;

	// Checkbox value should be boolean. Default to false if undefined.
	const checked = formData[fieldSchema.id] === true;

	const handleCheckedChange = (newCheckedState: Checkbox.CheckedState) => {
		// Radix onCheckedChange returns boolean or 'indeterminate'. We only care about boolean.
		onFieldChange(fieldSchema.id, newCheckedState === true);
	};

	return (
		<Field
			name={fieldSchema.id}
			className={`mb-4 grid ${fieldSchema.className || ""}`}
			style={fieldSchema.style}
		>
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
				{fieldSchema.label && (
					<Label htmlFor={fieldSchema.id} className={`${labelStyles} cursor-pointer`}>
						{fieldSchema.label}
					</Label>
				)}
			</div>
			{/* Radix Form Message for checkbox often requires a bit more setup if specific messages are needed beyond 'required' for a boolean */} 
			{fieldSchema.validation?.required && (
				<Message className={formMessageStyles} name={fieldSchema.id} match={(value) => value !== "true"}>
					{fieldSchema.label || "This checkbox"} must be checked.
				</Message>
			)}
			{fieldSchema.description && (
				<div className="mt-1 ml-7 text-sm text-gray-500">
					{fieldSchema.description}
				</div>
			)}
		</Field>
	);
}
