import React from "react";
import { Field, Label, Message } from "@radix-ui/react-form";
import * as Select from "@radix-ui/react-select";
import {
	ChevronDownIcon,
	CheckIcon,
	ChevronUpIcon
} from "@radix-ui/react-icons";
import { FieldComponent, FieldDefinition } from "./types";
import fieldRegistry from "./FieldRegistry";
import { inputStyles, labelStyles, formMessageStyles } from "./styles";

const SelectComponent: FieldComponent = ({
	field,
	value,
	onChange,
	className
}) => {
	const displayOptions = Array.isArray(field.options) ? field.options : [];
	const selectPlaceholderText = field.placeholder ||
		(field.label ? `Select ${field.label.toLowerCase()}` : "Select an option");

	return (
		<Select.Root
			value={value ?? ""}
			onValueChange={onChange}
			required={field.validation?.required}
			disabled={field.disabled}
		>
			<Select.Trigger
				className={`flex items-center ${inputStyles} ${className ||
				""} justify-between data-[placeholder]:text-gray-500 ${
					field.disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"
				}`}
				aria-label={field.label}
				style={field.style}
			>
				<Select.Value placeholder={selectPlaceholderText} />
				<Select.Icon className={field.disabled ? "opacity-50" : ""}>
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
									disabled={field.disabled}
									className={`
                    text-sm leading-none text-gray-900 rounded flex items-center h-8 pl-7 pr-3 py-1.5 relative select-none
                    ${field.disabled ? "text-gray-400 cursor-not-allowed" :
										"cursor-pointer"}
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
	);
};

const renderField: FieldDefinition["render"] = (props) => {
	const { field } = props;

	return (
		<Field
			name={field.id}
			className={`mb-4 grid ${field.className || ""}`}
			style={field.style}
		>
			<div className="flex items-baseline justify-between">
				{field.label && (
					<Label className={labelStyles}>
						{field.label}
					</Label>
				)}
				<Message className={formMessageStyles} match="valueMissing">
					{field.label ? `${field.label} is required` :
						"Please select an option"}
				</Message>
			</div>
			<SelectComponent {...props} />
			{field.description && (
				<div className="mt-1 text-sm text-gray-500">
					{field.description}
				</div>
			)}
		</Field>
	);
};

const SelectField: FieldDefinition = {
	component: SelectComponent,
	render: renderField,
};

// Register the field type
fieldRegistry.registerField("select", SelectField);

export default SelectField;
