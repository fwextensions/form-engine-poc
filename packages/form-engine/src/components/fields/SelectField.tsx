import React from "react";
import * as Form from "@radix-ui/react-form";
import * as SelectPrimitive from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";
import { FieldComponentProps } from "./types";

const SelectField: React.FC<FieldComponentProps> = ({ field, value, onChange, className }) => {
	const placeholderOption = field.options?.find(opt => opt.value === "");
	const selectPlaceholderText = placeholderOption 
		? placeholderOption.label 
		: (field.placeholder || "Select an option");
	
	const displayOptions = field.options?.filter(opt => opt.value !== "") || [];
	
	return (
		<Form.Control asChild>
			<SelectPrimitive.Root 
				name={field.id} 
				required={field.validation?.required}
				value={value ?? ""}
				onValueChange={onChange}
			>
				<SelectPrimitive.Trigger className={`${className} justify-between data-[placeholder]:text-gray-500`}>
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
									value={option.value}
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
};

export default SelectField;
