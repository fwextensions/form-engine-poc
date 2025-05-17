"use client";

import React from "react";
import * as Form from "@radix-ui/react-form";
import * as SelectPrimitive from "@radix-ui/react-select";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, CircleIcon } from "@radix-ui/react-icons";
import { FormField } from "@/services/schemaParser";

interface FormFieldRendererProps {
	field: FormField;
	// For M2.3, we will pass down form state and update functions if needed at this level
	// For now, Radix Form handles individual field state
}

const FormFieldRenderer: React.FC<FormFieldRendererProps> = ({ field }) => {
	const commonInputClassName = "box-border w-full bg-gray-100 shadow-sm border border-gray-300 inline-flex h-[35px] appearance-none items-center justify-center rounded-[4px] px-[10px] text-[15px] leading-none text-gray-900 outline-none hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 selection:color-white selection:bg-blue-600";
	const labelClassName = "text-[15px] font-medium leading-[35px] text-gray-700";
	const formMessageClassName = "text-[13px] text-red-600 opacity-[0.9]";

	const renderField = () => {
		switch (field.type) {
			case "text":
			case "email":
			case "password": // Added password for completeness, though not in M2 spec explicitly
			case "date":
				return (
					<Form.Control asChild>
						<input
							type={field.type}
							placeholder={field.placeholder}
							required={field.validation?.required}
							className={commonInputClassName}
						/>
					</Form.Control>
				);
			case "textarea":
				return (
					<Form.Control asChild>
						<textarea
							placeholder={field.placeholder}
							required={field.validation?.required}
							className={`${commonInputClassName} h-auto min-h-[70px] py-2 leading-normal`} // Adjust height
						/>
					</Form.Control>
				);
			case "select": {
				const placeholderOption = field.options?.find(opt => opt.value === "");
				const selectPlaceholderText = placeholderOption 
					? placeholderOption.label 
					: (field.placeholder || "Select an option");
				
				const displayOptions = field.options?.filter(opt => opt.value !== "") || [];
				
				// If a placeholder option (value: "") was defined, the select should default to ""
				// to show that placeholder. Otherwise, undefined (no specific default).
				const rootDefaultValue = placeholderOption ? "" : undefined;

				return (
					<Form.Control asChild>
						<SelectPrimitive.Root 
							name={field.id} 
							required={field.validation?.required} // For native constraint API, Radix Form handles its own
							defaultValue={rootDefaultValue}
						>
							<SelectPrimitive.Trigger className={`${commonInputClassName} justify-between data-[placeholder]:text-gray-500`}>
								<SelectPrimitive.Value placeholder={selectPlaceholderText} />
								<SelectPrimitive.Icon>
									<ChevronDownIcon />
								</SelectPrimitive.Icon>
							</SelectPrimitive.Trigger>
							<SelectPrimitive.Portal>
								<SelectPrimitive.Content position="popper" sideOffset={5} className="z-50 w-[--radix-select-trigger-width] bg-white rounded-md shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)]">
									<SelectPrimitive.ScrollUpButton className="flex items-center justify-center h-[25px] bg-white text-gray-700 cursor-default">
										<ChevronUpIcon />
									</SelectPrimitive.ScrollUpButton>
									<SelectPrimitive.Viewport className="p-[5px]">
										{displayOptions.map((option) => (
											<SelectPrimitive.Item
												key={option.value}
												value={option.value} // This will now never be an empty string
												className="text-[13px] leading-none text-gray-900 rounded-[3px] flex items-center h-[25px] pr-[35px] pl-[25px] relative select-none data-[disabled]:text-gray-400 data-[disabled]:pointer-events-none data-[highlighted]:outline-none data-[highlighted]:bg-blue-500 data-[highlighted]:text-white"
											>
												<SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
												<SelectPrimitive.ItemIndicator className="absolute left-0 w-[25px] inline-flex items-center justify-center">
													<CheckIcon />
												</SelectPrimitive.ItemIndicator>
											</SelectPrimitive.Item>
										))}
									</SelectPrimitive.Viewport>
									<SelectPrimitive.ScrollDownButton className="flex items-center justify-center h-[25px] bg-white text-gray-700 cursor-default">
										<ChevronDownIcon />
									</SelectPrimitive.ScrollDownButton>
								</SelectPrimitive.Content>
							</SelectPrimitive.Portal>
						</SelectPrimitive.Root>
					</Form.Control>
				);
			}
			case "checkbox":
				return (
					// Radix Form.Control doesn't directly wrap Checkbox in the same way as input, handle state if needed or structure differently
					// For simple required, Radix Form.Field handles it if name matches.
					// For complex interaction with form state, might need to lift state or use Controller.
					// For PoC, let's keep it simple.
					<div className="flex items-center gap-2 mt-1">
						<CheckboxPrimitive.Root
							id={field.id} // Important for label association
							name={field.id} // For form data
							required={field.validation?.required}
							className="shadow-sm flex h-[20px] w-[20px] appearance-none items-center justify-center rounded-[4px] bg-gray-100 border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white"
						>
							<CheckboxPrimitive.Indicator>
								<CheckIcon className="h-4 w-4" />
							</CheckboxPrimitive.Indicator>
						</CheckboxPrimitive.Root>
						{/* Separate label for checkbox, Radix Form.Label is usually for the Form.Field itself */}
						<label htmlFor={field.id} className="text-[15px] text-gray-700 select-none">
							{field.label} {/* Re-iterate label here as it's not the main Form.Label */}
						</label>
					</div>
				);
			case "radio":
				return (
					<RadioGroupPrimitive.Root
						name={field.id}
						required={field.validation?.required}
						className="flex flex-col gap-2 mt-1"
						// defaultValue={field.defaultValue} // if you want to add default value handling
					>
						{field.options?.map((option) => (
							<div key={option.value} className="flex items-center">
								<RadioGroupPrimitive.Item
									value={option.value}
									id={`${field.id}-${option.value}`}
									className="bg-gray-100 w-[20px] h-[20px] rounded-full shadow-sm border border-gray-300 hover:border-gray-400 focus:ring-2 focus:ring-blue-500 outline-none cursor-default data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
								>
									<RadioGroupPrimitive.Indicator className="flex items-center justify-center w-full h-full relative after:content-[''] after:block after:w-[10px] after:h-[10px] after:rounded-[50%] after:bg-white" />
								</RadioGroupPrimitive.Item>
								<label htmlFor={`${field.id}-${option.value}`} className="text-gray-700 text-[15px] leading-none pl-[10px] select-none">
									{option.label}
								</label>
							</div>
						))}
					</RadioGroupPrimitive.Root>
				);
			default:
				return <p className="text-red-500">Unsupported field type: {field.type}</p>;
		}
	};

	// Checkbox is special: its label is usually part of the control, not above like other fields.
	// So we adjust rendering for checkbox.
	if (field.type === "checkbox") {
		return (
			<Form.Field name={field.id} className="mb-4 grid">
				{/* No main Form.Label here, it's part of the control itself */}
				{renderField()} {/* This will render the Checkbox and its inline label */}
				<Form.Message className={formMessageClassName} match="valueMissing">
					This field is required. {/* Generic message for checkbox required */}
				</Form.Message>
			</Form.Field>
		);
	}
	
	// Radio group also has its main label above, and item labels within.
	if (field.type === "radio") {
		return (
			<Form.Field name={field.id} className="mb-4 grid">
				<Form.Label className={labelClassName}>{field.label}</Form.Label>
				{renderField()} {/* This will render the RadioGroup with items */}
				<Form.Message className={formMessageClassName} match="valueMissing">
					Please select an option for {field.label.toLowerCase()}.
				</Form.Message>
			</Form.Field>
		);
	}

	return (
		<Form.Field name={field.id} className="mb-4 grid">
			<div className="flex items-baseline justify-between">
				<Form.Label className={labelClassName}>
					{field.label}
				</Form.Label>
				<Form.Message className={formMessageClassName} match="valueMissing">
					Please enter {field.label.toLowerCase()}
				</Form.Message>
				<Form.Message className={formMessageClassName} match="typeMismatch">
					Please provide a valid {field.type === "email" ? "email address" : field.type}
				</Form.Message>
				{/* Add other specific validation messages if needed */}
			</div>
			{renderField()}
		</Form.Field>
	);
};

export default FormFieldRenderer;
