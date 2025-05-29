import React from "react";
import { Message } from "@radix-ui/react-form";
import * as Select from "@radix-ui/react-select";
import {
	ChevronDownIcon,
	CheckIcon,
	ChevronUpIcon
} from "@radix-ui/react-icons";
import type { FormFieldOption } from "../../services/schemaParser";
import type { RegisteredComponentProps } from "../componentRegistry";
import { inputStyles, messageStyles } from "./styles";
import FormFieldContainer from "./FormFieldContainer";

export default function SelectField(
	props: RegisteredComponentProps)
{
	const { component, formData, onFieldChange } = props;

	// Type guard to ensure this is a select field
	if (component.type !== "select") {
		// This component should only be rendered for "select" type components.
		// If this happens, it's likely an issue with the component registry or schema.
		console.error(
			`SelectField received a component of type '${component.type}' (id: ${component.id}). Expected 'select'.`,
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
			<Select.Root
				value={value ?? ""}
				onValueChange={handleChange}
				required={fieldSchema.validation?.required}
				disabled={fieldSchema.disabled}
			>
				<Select.Trigger
					className={`flex items-center ${inputStyles} ${fieldSchema.className || ""} justify-between data-[placeholder]:text-gray-500 ${
						fieldSchema.disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"
					}`}
					aria-label={fieldSchema.label}
					autoFocus={fieldSchema.autoFocus}
					tabIndex={fieldSchema.tabIndex}
				>
					<Select.Value placeholder={fieldSchema.placeholder ||
						(fieldSchema.label ? `Select ${fieldSchema.label.toLowerCase()}` : "Select an option")} />
					<Select.Icon className={fieldSchema.disabled ? "opacity-50" : ""}>
						<ChevronDownIcon className="w-4 h-4" />
					</Select.Icon>
				</Select.Trigger>
				<Select.Portal>
					<Select.Content
						position="popper"
						sideOffset={5}
						className="z-50 w-[var(--radix-select-trigger-width)] bg-white rounded-md shadow-lg border border-gray-200"
					>
						<Select.ScrollUpButton
							className="flex items-center justify-center h-6 bg-white text-gray-700 cursor-default hover:bg-gray-50"
						>
							<ChevronUpIcon className="w-4 h-4" />
						</Select.ScrollUpButton>

						<Select.Viewport className="p-1">
							{displayOptions.length > 0 ? (
								displayOptions.map((option: FormFieldOption) => (
									<Select.Item
										key={option.value}
										value={option.value}
										disabled={fieldSchema.disabled}
										className={`
                    text-sm leading-none text-gray-900 rounded flex items-center h-8 pl-7 pr-3 py-1.5 relative select-none
                    ${
											fieldSchema.disabled ? "text-gray-400 cursor-not-allowed" :
												"cursor-pointer"
										}
                    data-[highlighted]:outline-none data-[highlighted]:bg-blue-500 data-[highlighted]:text-white
                  `}
									>
										<Select.ItemText>{option.label}</Select.ItemText>
										<Select.ItemIndicator className="absolute left-1.5 top-1/2 -translate-y-1/2 inline-flex items-center">
											<CheckIcon className="w-4 h-4" />
										</Select.ItemIndicator>
									</Select.Item>
								))
							) : (
								<div className="px-3 py-1.5 text-sm text-gray-500">
									No options available
								</div>
							)}
						</Select.Viewport>

						<Select.ScrollDownButton
							className="flex items-center justify-center h-6 bg-white text-gray-700 cursor-default hover:bg-gray-50"
						>
							<ChevronDownIcon className="w-4 h-4" />
						</Select.ScrollDownButton>
					</Select.Content>
				</Select.Portal>
			</Select.Root>
			<Message className={messageStyles} name={fieldSchema.id} match="valueMissing">
				{fieldSchema.label ? `${fieldSchema.label} is required` :
					"Please select an option"}
			</Message>
			{/* TODO: Add other validation messages here if needed */}
		</FormFieldContainer>
	);
}
