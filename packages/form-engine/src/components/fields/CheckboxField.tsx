import React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "@radix-ui/react-icons";
import { FieldComponentProps } from "./types";

const CheckboxField: React.FC<FieldComponentProps> = ({ field, value, onChange }) => {
	return (
		<div className="flex items-center gap-2 mt-1">
			<CheckboxPrimitive.Root
				id={field.id}
				name={field.id}
				required={field.validation?.required}
				className="shadow-sm flex h-[20px] w-[20px] appearance-none items-center justify-center rounded-[4px] bg-gray-100 border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white"
				checked={!!value}
				onCheckedChange={(checked) => onChange?.(checked === true)}
			>
				<CheckboxPrimitive.Indicator>
					<CheckIcon className="h-4 w-4" />
				</CheckboxPrimitive.Indicator>
			</CheckboxPrimitive.Root>
			<label htmlFor={field.id} className="text-[15px] text-gray-700 select-none">
				{field.label}
			</label>
		</div>
	);
};

export default CheckboxField;
