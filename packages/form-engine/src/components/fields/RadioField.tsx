import React from "react";
import { Field, Label, Message } from "@radix-ui/react-form";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { FormField, FormFieldOption } from "../../services/schemaParser";
import { RegisteredComponentProps } from "../componentRegistry";
import { labelStyles, formMessageStyles } from "./styles";

export default function RadioField(props: RegisteredComponentProps) {
	const fieldSchema = props.component as FormField;
	const { formData, onFieldChange } = props;

	const value = formData[fieldSchema.id] || "";
	const handleChange = (newValue: string) => {
		onFieldChange(fieldSchema.id, newValue);
	};

	const displayOptions: FormFieldOption[] = Array.isArray(fieldSchema.options) ? fieldSchema.options : [];

	return (
		<Field
			name={fieldSchema.id}
			className={`mb-4 grid ${fieldSchema.className || ""}`}
			style={fieldSchema.style}
		>
			{fieldSchema.label && (
				<div className="flex items-baseline justify-between">
					<Label className={labelStyles}>{fieldSchema.label}</Label>
					<Message className={formMessageStyles} name={fieldSchema.id} match="valueMissing">
						{fieldSchema.label || "This field"} is required
					</Message>
				</div>
			)}
			<RadioGroup.Root
				className={`mt-2 space-y-2 ${fieldSchema.className || ""}`}
				value={value}
				onValueChange={handleChange}
				required={fieldSchema.validation?.required}
				disabled={fieldSchema.disabled}
				autoFocus={fieldSchema.autoFocus}
			>
				{displayOptions.map((option) => (
					<div key={option.value} className="flex items-center">
						<RadioGroup.Item
							value={option.value}
							id={`${fieldSchema.id}-${option.value}`}
							className={`peer h-4 w-4 rounded-full border border-slate-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${
								fieldSchema.disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"
							}`}
							disabled={fieldSchema.disabled}
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
			{fieldSchema.description && (
				<div className="mt-1 text-sm text-gray-500">
					{fieldSchema.description}
				</div>
			)}
		</Field>
	);
}
