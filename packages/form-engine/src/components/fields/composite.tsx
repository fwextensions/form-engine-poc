// packages/form-engine/src/components/fields/composite.tsx
// Building block for fields made of several inputs (name, date of birth).
// Each part is its own Base UI field so native constraint messages and
// custom validation attach to the part that failed.
import React from "react";
import { Field } from "@base-ui-components/react/field";
import { inputClassName } from "./styles";

export interface SubFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "name" | "id"> {
	/** Field id of the composite; the part id becomes `${fieldId}-${part}`. */
	fieldId: string;
	part: string;
	label: string;
	/** Custom validation run by the form on submit: return a message, or null when valid. */
	validate?: () => string | null;
	/** A problem computed by the parent; shown immediately and marks the part invalid. */
	error?: string | null;
	inputRef?: React.Ref<HTMLInputElement>;
}

export function SubField({ fieldId, part, label, validate, error, inputRef, className, ...inputProps }: SubFieldProps) {
	const id = `${fieldId}-${part}`;
	const name = `${fieldId}.${part}`;
	return (
		<Field.Root name={name} validate={validate} invalid={error ? true : undefined} className="min-w-0">
			<Field.Label htmlFor={id} className="block text-xs font-medium text-ink-600 mb-1">
				{label}
			</Field.Label>
			<Field.Control ref={inputRef} id={id} {...inputProps} className={`${inputClassName} mt-0 ${className ?? ""}`} />
			{error ? (
				<Field.Error match className="text-xs text-danger-500 mt-1">
					{error}
				</Field.Error>
			) : (
				validate && <Field.Error className="text-xs text-danger-500 mt-1" />
			)}
			<Field.Error match="valueMissing" className="text-xs text-danger-500 mt-1">
				Required.
			</Field.Error>
			<Field.Error match="patternMismatch" className="text-xs text-danger-500 mt-1">
				Please match the requested format.
			</Field.Error>
			<Field.Error match="rangeUnderflow" className="text-xs text-danger-500 mt-1">
				Too small.
			</Field.Error>
			<Field.Error match="rangeOverflow" className="text-xs text-danger-500 mt-1">
				Too large.
			</Field.Error>
		</Field.Root>
	);
}
