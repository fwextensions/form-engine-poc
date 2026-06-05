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
					<Form.Label htmlFor={htmlFor} className="block text-sm font-medium text-ink-700">
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
			{/* Default message for when a required field is empty. The input needs the 'required' attribute. */}
			<Form.Message match="valueMissing" className="text-xs text-danger-500 mt-1">
				Please fill out this field.
			</Form.Message>
			{/* Add other common Form.Message matches if needed, e.g., typeMismatch for email/url inputs */}
		</Form.Field>
	);
};

// No createComponent call here, as this is a presentational/layout component
// not directly driven by a schema 'type'. It's used *by* other components.
