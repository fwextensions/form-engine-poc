// packages/form-engine/src/components/fields/composite.tsx
// Building block for fields made of several inputs (name, date of birth).
// Each part is its own Radix Form field so native constraint messages
// attach to the part that failed.
import React from "react";
import * as Form from "@radix-ui/react-form";
import { inputClassName } from "./styles";

export interface SubFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "name" | "id"> {
	/** Field id of the composite; the part id becomes `${fieldId}-${part}`. */
	fieldId: string;
	part: string;
	label: string;
	inputRef?: React.Ref<HTMLInputElement>;
	/** Message shown while the input's `customError` validity flag is set (via `setCustomValidity`). */
	customError?: string | null;
}

export function SubField({ fieldId, part, label, inputRef, customError, className, ...inputProps }: SubFieldProps) {
	const id = `${fieldId}-${part}`;
	const name = `${fieldId}.${part}`;
	return (
		<Form.Field name={name} className="min-w-0">
			<Form.Label htmlFor={id} className="block text-xs font-medium text-ink-600 mb-1">
				{label}
			</Form.Label>
			<Form.Control asChild>
				<input ref={inputRef} id={id} name={name} {...inputProps} className={`${inputClassName} mt-0 ${className ?? ""}`} />
			</Form.Control>
			<Form.Message match="valueMissing" className="text-xs text-danger-500 mt-1">
				Required.
			</Form.Message>
			<Form.Message match="patternMismatch" className="text-xs text-danger-500 mt-1">
				Please match the requested format.
			</Form.Message>
			<Form.Message match="rangeUnderflow" className="text-xs text-danger-500 mt-1">
				Too small.
			</Form.Message>
			<Form.Message match="rangeOverflow" className="text-xs text-danger-500 mt-1">
				Too large.
			</Form.Message>
			{customError && (
				<Form.Message match={() => true} className="text-xs text-danger-500 mt-1">
					{customError}
				</Form.Message>
			)}
		</Form.Field>
	);
}
