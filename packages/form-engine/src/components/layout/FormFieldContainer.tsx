// packages/form-engine/src/components/layout/FormFieldContainer.tsx
import React from "react";
import { Field } from "@base-ui/react/field";

// Required asterisk is handled by the .field-required-marker CSS class in globals.css
// (Tailwind v4 scanner can't reliably detect classes inside JS string variables)
const RequiredFieldStyles = "field-required-marker";

/** Messages for native constraint-validation states. Fields may override any of them. */
export type ConstraintMessages = Partial<Record<keyof ValidityState, string>>;

export const defaultConstraintMessages: ConstraintMessages = {
	valueMissing: "Please fill out this field.",
	typeMismatch: "Please enter a valid value.",
	patternMismatch: "Please match the requested format.",
	tooShort: "This value is too short.",
	tooLong: "This value is too long.",
	rangeUnderflow: "This value is too small.",
	rangeOverflow: "This value is too large.",
	stepMismatch: "Please enter a valid value.",
	badInput: "Please enter a valid value.",
};

// Props for FormFieldContainer
export interface FormFieldContainerProps {
	/** Input name (scoped inside repeating groups). */
	name: string;
	/** The field's data key, exposed as `data-field-id` for tooling; defaults to `name`. */
	fieldId?: string;
	/** Marks the label with the required asterisk (`data-required` on the root). */
	required?: boolean;
	label?: string;
	description?: string;
	htmlFor?: string; // Corresponds to the input's id
	children: React.ReactNode; // The actual input control (e.g., <input />, <select />)
	className?: string;
	style?: React.CSSProperties;
	/** Overrides for the default constraint messages. */
	messages?: ConstraintMessages;
	/**
	 * Custom validation for the field's value (Base UI `Field.Root` `validate`):
	 * return a message to show, or null when valid.
	 */
	validate?: (value: unknown) => string | string[] | null;
	/** When to run `validate` and native checks. Defaults to the form's mode (on submit). */
	validationMode?: "onSubmit" | "onBlur" | "onChange";
}

/**
 * Standard wrapper for a field: label, description, the control, and the
 * validation messages. Built on Base UI `Field`, which tracks the control's
 * native validity (and `validate`) and shows the matching `Field.Error`.
 */
export const FormFieldContainer: React.FC<FormFieldContainerProps> = ({
	name,
	fieldId,
	required,
	label,
	description,
	htmlFor,
	children,
	className,
	style,
	messages,
	validate,
	validationMode,
}) => {
	const constraintMessages = { ...defaultConstraintMessages, ...messages };
	return (
		<Field.Root
			name={name}
			validate={validate}
			validationMode={validationMode}
			data-field-id={fieldId ?? name}
			data-required={required || undefined}
			className={`mb-5 ${RequiredFieldStyles} ${className || ""}`}
			style={style}
		>
			{label && (
				<div className="flex items-baseline justify-between mb-1.5">
					<Field.Label id={htmlFor ? `${htmlFor}-label` : undefined} htmlFor={htmlFor} className="block text-sm font-medium text-ink-700">
						{label}
					</Field.Label>
				</div>
			)}
			{description && (
				<Field.Description id={htmlFor ? `${htmlFor}-description` : undefined} className="text-xs text-ink-500 mt-1 mb-1.5">
					{description}
				</Field.Description>
			)}
			{children}
			{/* Message from `validate`, when it returns one */}
			{validate && <Field.Error className="text-xs text-danger-500 mt-1" />}
			{/* One message per native constraint state; each shows only when the control's validity matches */}
			{Object.entries(constraintMessages).map(([match, message]) => (
				<Field.Error key={match} match={match as keyof ValidityState} className="text-xs text-danger-500 mt-1">
					{message}
				</Field.Error>
			))}
		</Field.Root>
	);
};
