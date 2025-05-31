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
import { inputStyles, messageStyles, borderRadius, transition } from "./styles";
import FormFieldContainer from "./FormFieldContainer";

export default function SelectField(
	props: RegisteredComponentProps)
{
	const { component, formData, onFieldChange } = props;

	if (component.type !== "select") {
		console.error(
			`SelectField received a component of type '${component.type}' (id: ${component.id}). Expected 'select'.`,
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
			<Select.Root
				value={value ?? ""}
				onValueChange={handleChange}
				required={fieldSchema.validation?.required}
				disabled={fieldSchema.disabled}
			>
				<Select.Trigger
					className={`flex items-center ${inputStyles} ${fieldSchema.className || ""} justify-between data-[placeholder]:text-gray-400 ${
						fieldSchema.disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"
					}`}
					aria-label={fieldSchema.label}
					autoFocus={fieldSchema.autoFocus}
					tabIndex={fieldSchema.tabIndex}
				>
					<Select.Value placeholder={fieldSchema.placeholder ||
						(fieldSchema.label ? `Select ${fieldSchema.label.toLowerCase()}` : "Select an option")} />
					<Select.Icon className={fieldSchema.disabled ? "opacity-50" : "text-gray-500"}>
						<ChevronDownIcon className="w-4 h-4" />
					</Select.Icon>
				</Select.Trigger>
				<Select.Portal>
					<Select.Content
						position="popper"
						sideOffset={5}
						className={`z-50 w-[var(--radix-select-trigger-width)] bg-white ${borderRadius} shadow-lg border border-gray-200 ${transition}`}
					>
						<Select.ScrollUpButton
							className={`flex items-center justify-center h-6 bg-white text-gray-700 cursor-default hover:bg-gray-50 ${transition}`}
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
                    text-sm leading-none text-gray-900 ${borderRadius} flex items-center h-8 pl-7 pr-3 py-1.5 relative select-none ${transition}
                    ${
											fieldSchema.disabled ? "text-gray-400 cursor-not-allowed" :
												"cursor-pointer data-[highlighted]:outline-none data-[highlighted]:bg-blue-500 data-[highlighted]:text-white hover:bg-gray-100"
										}
                  `}
									>
										<Select.ItemText>{option.label}</Select.ItemText>
										<Select.ItemIndicator className="absolute left-0 w-7 inline-flex items-center justify-center">
											<CheckIcon className="w-4 h-4 data-[state=checked]:text-blue-600" />
										</Select.ItemIndicator>
									</Select.Item>
								))
							) : (
								<Select.Item value="no-options" disabled className={`text-sm text-gray-500 ${borderRadius} flex items-center h-8 pl-7 pr-3 py-1.5 relative select-none`}>
									No options available
								</Select.Item>
							)}
						</Select.Viewport>

						<Select.ScrollDownButton
							className={`flex items-center justify-center h-6 bg-white text-gray-700 cursor-default hover:bg-gray-50 ${transition}`}
						>
							<ChevronDownIcon className="w-4 h-4" />
						</Select.ScrollDownButton>
					</Select.Content>
				</Select.Portal>
			</Select.Root>
			<Message className={messageStyles} name={fieldSchema.id} match="valueMissing">
				{fieldSchema.label || "This field"} is required
			</Message>
		</FormFieldContainer>
	);
}
