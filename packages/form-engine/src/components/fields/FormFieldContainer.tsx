import React from "react";
import { Field, Label } from "@radix-ui/react-form";
import type { FormField } from "../../services/schemaParser";
import { labelStyles } from "./styles";

type FormFieldProps = {
	component: FormField;
	children?: React.ReactNode;
};

export default function FormFieldContainer(
	props: FormFieldProps)
{
	const { children, component: { id, className, label, description, style } } = props;

	return (
		<Field
			name={id}
			className={`mb-4 grid ${className || ""}`}
			style={style}
		>
			{label &&
				<Label className={`mb-1 ${labelStyles}`}>
					{label}
				</Label>
			}
			{children}
			{description &&
				<div className="mt-1 text-sm text-gray-500">
					{description}
				</div>
			}
		</Field>
	);
}
