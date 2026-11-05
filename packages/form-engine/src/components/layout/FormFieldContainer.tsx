// packages/form-engine/src/components/layout/FormFieldContainer.tsx
import React from "react";
import * as Form from "@radix-ui/react-form";

// Required asterisk is handled by the .field-required-marker CSS class in globals.css
// (Tailwind v4 scanner can't reliably detect classes inside JS string variables)
const RequiredFieldStyles = "field-required-marker";

// Props for FormFieldContainer
export interface FormFieldContainerProps {
	name: string;
	label?: string;
	description?: string;
	htmlFor?: string; // Corresponds to the input's id
	children: React.ReactNode; // The actual input control (e.g., <input />, <select />)
	className?: string;
	style?: React.CSSProperties;
	// For displaying validation messages.
	messages?: Array<{ type: string; message: string } | string>;
}

const constraintMessages: Record<string, string> = {
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

export const FormFieldContainer: React.FC<FormFieldContainerProps> = ({
	name,
	label,
	description,
	htmlFor,
	children,
	className,
	style,
	messages,
}) => {
	return (
		<Form.Field name={name} data-field-id={name} className={`mb-5 ${RequiredFieldStyles} ${className || ""}`} style={style}>
			{label && (
				<div className="flex items-baseline justify-between mb-1.5">
					<Form.Label id={htmlFor ? `${htmlFor}-label` : undefined} htmlFor={htmlFor} className="block text-sm font-medium text-ink-700">
						{label}
					</Form.Label>
				</div>
			)}
			{description && (
				<p id={htmlFor ? `${htmlFor}-description` : undefined} className="text-xs text-ink-500 mt-1 mb-1.5">
					{description}
				</p>
			)}
			{children}
			{messages && messages.map((msg, index) => (
				<Form.Message key={index} className="text-xs text-danger-500 mt-1">
					{typeof msg === "string" ? msg : msg.message}
				</Form.Message>
			))}
			{/* Messages for native constraint validation. Each control sets the matching attribute from its `validation` config. */}
			{Object.entries(constraintMessages).map(([match, message]) => (
				<Form.Message key={match} match={match as Form.FormMessageProps["match"]} className="text-xs text-danger-500 mt-1">
					{message}
				</Form.Message>
			))}
		</Form.Field>
	);
};

// No createComponent call here, as this is a presentational/layout component
// not directly driven by a schema 'type'. It's used *by* other components.
