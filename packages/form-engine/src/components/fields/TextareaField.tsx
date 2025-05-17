import React from "react";
import * as Form from "@radix-ui/react-form";
import { FieldComponentProps } from "./types";

const TextareaField: React.FC<FieldComponentProps> = ({ field, value, onChange, className }) => {
	return (
		<Form.Control asChild>
			<textarea
				placeholder={field.placeholder}
				required={field.validation?.required}
				className={`${className} h-auto min-h-[70px] py-2 leading-normal`}
				value={value || ""}
				onChange={(e) => onChange?.(e.target.value)}
			/>
		</Form.Control>
	);
};

export default TextareaField;
