import React from "react";
import * as Form from "@radix-ui/react-form";
import { FieldComponentProps } from "./types";

const TextField: React.FC<FieldComponentProps> = ({ field, value, onChange, className }) => {
	return (
		<Form.Control asChild>
			<input
				type={field.type}
				placeholder={field.placeholder}
				required={field.validation?.required}
				className={className}
				value={value || ""}
				onChange={(e) => onChange?.(e.target.value)}
			/>
		</Form.Control>
	);
};

export default TextField;
