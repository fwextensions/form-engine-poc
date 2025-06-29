// packages/form-engine/src/components/layout/FormFieldContainer.tsx
import React from "react";
import * as Form from "@radix-ui/react-form";

// some gnarly Tailwind arbitrary variant selectors to add a red asterisk to
// required fields inside FormFieldContainer
const RequiredFieldStyles = `
[&:has(input[required],select[required],textarea[required])_label]:after:content-['_*']
[&:has(input[required],select[required],textarea[required])_label]:after:text-red-600
`;

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
		<Form.Field name={name} className={`mb-4 ${RequiredFieldStyles} ${className || ""}`} style={style}>
			{label && (
				<div className="flex items-baseline justify-between mb-1">
					<Form.Label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700">
						{label}
					</Form.Label>
				</div>
			)}
			{description && (
				<p id={htmlFor ? `${htmlFor}-description` : undefined} className="text-xs text-gray-500 mt-1 mb-1">
					{description}
				</p>
			)}
			{children}
			{messages && messages.map((msg, index) => (
				<Form.Message key={index} className="text-xs text-red-500 mt-1">
					{typeof msg === "string" ? msg : msg.message}
				</Form.Message>
			))}
			{/* Default message for when a required field is empty. The input needs the 'required' attribute. */}
			<Form.Message match="valueMissing" className="text-xs text-red-500 mt-1">
				Please fill out this field.
			</Form.Message>
			{/* Add other common Form.Message matches if needed, e.g., typeMismatch for email/url inputs */}
		</Form.Field>
	);
};

// No createComponent call here, as this is a presentational/layout component
// not directly driven by a schema 'type'. It's used *by* other components.
