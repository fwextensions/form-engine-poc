import React from "react";
import { Field, Label, Message } from "@radix-ui/react-form";
import * as Select from "@radix-ui/react-select";
import {
	ChevronDownIcon,
	CheckIcon,
	ChevronUpIcon
} from "@radix-ui/react-icons";
import { FormField } from "../../services/schemaParser";
import { RegisteredComponentProps } from "../componentRegistry";
import { inputStyles, labelStyles, formMessageStyles } from "./styles";

const SelectFieldWrapper: React.FC<RegisteredComponentProps> = (props) => {
	const fieldSchema = props.component as FormField;
	const { formData, onFieldChange } = props;

	const value = formData[fieldSchema.id] || "";
	const handleChange = (newValue: string) => {
		onFieldChange(fieldSchema.id, newValue);
	};

	const displayOptions = Array.isArray(fieldSchema.options) ? fieldSchema.options : [];
	const selectPlaceholderText = fieldSchema.placeholder ||
		(fieldSchema.label ? `Select ${fieldSchema.label.toLowerCase()}` : "Select an option");

	return (
		<Field
			name={fieldSchema.id}
			className={`mb-4 grid ${fieldSchema.className || ""}`}
			style={fieldSchema.style}
		>
			<div className="flex items-baseline justify-between">
				{fieldSchema.label && (
					<Label className={labelStyles}>
						{fieldSchema.label}
					</Label>
				)}
				<Message className={formMessageStyles} name={fieldSchema.id} match="valueMissing">
					{fieldSchema.label ? `${fieldSchema.label} is required` :
						"Please select an option"}
				</Message>
				{/* TODO: Add other validation messages here if needed */}
			</div>
			<Select.Root
				value={value ?? ""} // Radix Select expects a string value or undefined
				onValueChange={handleChange} // Use the new handleChange
				required={fieldSchema.validation?.required}
				disabled={fieldSchema.disabled}
			>
				<Select.Trigger
					className={`flex items-center ${inputStyles} ${fieldSchema.className ||
					""} justify-between data-[placeholder]:text-gray-500 ${
						fieldSchema.disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"
					}`}
					aria-label={fieldSchema.label}
					// style prop is applied to the outer Field container
				>
					<Select.Value placeholder={selectPlaceholderText} />
					<Select.Icon className={fieldSchema.disabled ? "opacity-50" : ""}>
						<ChevronDownIcon className="w-4 h-4" />
					</Select.Icon>
				</Select.Trigger>
				<Select.Portal>
					<Select.Content
						position="popper"
						sideOffset={5}
						className="z-50 w-(--radix-select-trigger-width) bg-white rounded-md shadow-lg border border-gray-200"
					>
						<Select.ScrollUpButton
							className="flex items-center justify-center h-6 bg-white text-gray-700 cursor-default hover:bg-gray-50"
						>
							<ChevronUpIcon className="w-4 h-4" />
						</Select.ScrollUpButton>

						<Select.Viewport className="p-1">
							{displayOptions.length > 0 ? (
								displayOptions.map((option) => (
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
								<div className="px-3 py-1.5 text-sm text-gray-500">No options
									available</div>
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
			{fieldSchema.description && (
				<div className="mt-1 text-sm text-gray-500">
					{fieldSchema.description}
				</div>
			)}
		</Field>
	);
};

export default SelectFieldWrapper;
