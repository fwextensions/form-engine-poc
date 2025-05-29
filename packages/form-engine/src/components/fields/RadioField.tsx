import React from "react";
import { Label, Message } from "@radix-ui/react-form";
import * as RadioGroup from "@radix-ui/react-radio-group";
import type { FormFieldOption } from "../../services/schemaParser";
import type { RegisteredComponentProps } from "../componentRegistry";
import { labelStyles, messageStyles } from "./styles";
import FormFieldContainer from "./FormFieldContainer";

export default function RadioField(
	props: RegisteredComponentProps)
{
	const { component, formData, onFieldChange } = props;

	// Type guard to ensure this is a select field
	if (component.type !== "radio") {
		console.error(
			`RadioField received a component of type '${component.type}' (id: ${component.id}). Expected 'radio'.`,
		);
		return null; // Or render a more user-friendly error
	}

	const fieldSchema = component;

	const value = formData[fieldSchema.id] || "";
	const handleChange = (newValue: string) => {
		onFieldChange(fieldSchema.id, newValue);
	};

	const displayOptions = Array.isArray(fieldSchema.options) ? fieldSchema.options : [];

	return (
		<FormFieldContainer component={fieldSchema}>
			<RadioGroup.Root
				className="mt-2 space-y-2"
				value={value}
				onValueChange={handleChange}
				required={fieldSchema.validation?.required}
				disabled={fieldSchema.disabled}
			>
				{displayOptions.map((option: FormFieldOption, index: number) => (
					<div key={option.value} className="flex items-center">
						<RadioGroup.Item
							value={option.value}
							id={`${fieldSchema.id}-${option.value}`}
							className={`peer h-4 w-4 rounded-full border border-slate-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${
								fieldSchema.disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"
							}`}
							disabled={fieldSchema.disabled}
							autoFocus={fieldSchema.autoFocus && index === 0 && !fieldSchema.disabled}
						>
							<RadioGroup.Indicator className="flex items-center justify-center">
								<div className="h-2.5 w-2.5 rounded-full bg-current" />
							</RadioGroup.Indicator>
						</RadioGroup.Item>
						<Label
							htmlFor={`${fieldSchema.id}-${option.value}`}
							className={`ml-2 block text-sm ${labelStyles} ${
								fieldSchema.disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"
							}`}
						>
							{option.label}
						</Label>
					</div>
				))}
			</RadioGroup.Root>
			{fieldSchema.validation?.required && (
				<Message className={messageStyles} name={fieldSchema.id} match="valueMissing">
					{fieldSchema.label || "This field"} is required
				</Message>
			)}
			{fieldSchema.description && (
				<div className="mt-1 text-sm text-gray-500">
					{fieldSchema.description}
				</div>
			)}
		</FormFieldContainer>
	);
}
