import React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { FieldComponentProps } from "./types";

const RadioField: React.FC<FieldComponentProps> = ({ field, value, onChange }) => {
	return (
		<RadioGroupPrimitive.Root
			name={field.id}
			required={field.validation?.required}
			className="flex flex-col gap-2 mt-1"
			value={value ?? ""}
			onValueChange={onChange}
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
};

export default RadioField;
