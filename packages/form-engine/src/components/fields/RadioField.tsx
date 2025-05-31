import React from "react";
import { Label, Message } from "@radix-ui/react-form";
import * as RadioGroup from "@radix-ui/react-radio-group";
import type { FormFieldOption } from "../../services/schemaParser";
import type { RegisteredComponentProps } from "../componentRegistry";
import { labelStyles, messageStyles, focusRing, transition } from "./styles";
import FormFieldContainer from "./FormFieldContainer";

export default function RadioField(
	props: RegisteredComponentProps)
{
	const { component, formData, onFieldChange } = props;

	if (component.type !== "radio") {
		console.error(
			`RadioField received a component of type '${component.type}' (id: ${component.id}). Expected 'radio'.`,
		);
		return null;
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
				className="mt-1 space-y-2"
				value={value}
				onValueChange={handleChange}
				required={fieldSchema.validation?.required}
				disabled={fieldSchema.disabled}
				aria-label={fieldSchema.label || fieldSchema.id}
			>
				{displayOptions.map((option: FormFieldOption, index: number) => (
					<div key={option.value} className="flex items-center space-x-2.5">
						<RadioGroup.Item
							value={option.value}
							id={`${fieldSchema.id}-${option.value}`}
							className={`peer h-4 w-4 rounded-full border border-gray-300 ${focusRing} ${transition} disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-100 disabled:border-gray-200 ${
								fieldSchema.disabled ? "cursor-not-allowed" : "cursor-pointer"
							}`}
							disabled={fieldSchema.disabled}
							autoFocus={fieldSchema.autoFocus && index === 0 && !fieldSchema.disabled}
						>
							<RadioGroup.Indicator className="flex items-center justify-center w-full h-full relative after:content-[''] after:block after:w-3 after:h-3 after:rounded-full after:bg-blue-600 after:scale-[0.9]" />
						</RadioGroup.Item>
						<Label
							htmlFor={`${fieldSchema.id}-${option.value}`}
							className={`${labelStyles} !mb-0 font-normal ${
								fieldSchema.disabled ? "cursor-not-allowed text-gray-400" : "cursor-pointer text-gray-700"
							}`}
						>
							{option.label}
						</Label>
					</div>
				))}
			</RadioGroup.Root>
			{fieldSchema.validation?.required && (
				<Message className={`${messageStyles} mt-2`} name={fieldSchema.id} match="valueMissing">
					{fieldSchema.label || "This field"} is required
				</Message>
			)}
			{/* Description is handled by FormFieldContainer */}
		</FormFieldContainer>
	);
}
