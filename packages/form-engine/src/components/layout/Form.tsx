// packages/form-engine/src/components/layout/Form.tsx
import React from "react";
import { z } from "zod";
import { baseLayoutComponentConfigSchema } from "../baseSchemas";
import { createComponent, FormEngineContext } from "../../core/componentFactory";

// 1. Define Configuration Schema
export const FormConfigSchema = baseLayoutComponentConfigSchema.extend({
	type: z.literal("form"),
	submitButtonText: z.string().optional(),
	submitButtonClassName: z.string().optional(),
	className: z.string().optional(),
	style: z.record(z.string(), z.any()).optional(),
});
export type FormConfig = z.infer<typeof FormConfigSchema>;

// 2. Define Props for the React Component
export interface FormProps extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
	submitButtonText?: string;
	submitButtonClassName?: string;
	children?: React.ReactNode; // Rendered children will be passed by DynamicRenderer
	onFormSubmit?: (formData: Record<string, any>) => void; // onSubmit from context
	formData?: Record<string, any>; // formData from context
	isViewMode?: boolean; // To disable submit button in view mode
}

// 3. Create the React Component
export const FormComponent: React.FC<FormProps> = ({
	children,
	className,
	style,
	submitButtonText = "Submit",
	submitButtonClassName,
	onFormSubmit,
	formData,
	isViewMode,
	...rest
}) => {
	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (onFormSubmit && formData) {
			onFormSubmit(formData);
		}
	};

	return (
		<form
			{...rest} // Passes through other HTML attributes like id
			className={`form-root space-y-6 ${className || ''}`}
			style={style}
			onSubmit={handleSubmit}
		>
			{children}
			{onFormSubmit && submitButtonText && (
				<div className="form-actions mt-6 pt-4 border-t border-gray-200">
					<button
						type="submit"
						className={`px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed ${submitButtonClassName || ''}`}
						disabled={isViewMode}
					>
						{submitButtonText}
					</button>
				</div>
			)}
		</form>
	);
};

// 4. Register the Component
createComponent<FormConfig, FormProps>({
	type: "form",
	schema: FormConfigSchema,
	component: FormComponent,
	transformProps: (config: FormConfig, context: FormEngineContext, renderChildren): FormProps => {
		const { id, type, condition, children, submitButtonText, submitButtonClassName, className, style, ...restOfConfig } = config;
		console.log("Form.tsx transformProps - input config.children:", JSON.stringify(children, null, 2));

		const renderedChildElements = renderChildren(children, context);
		console.log("Form.tsx transformProps - output of renderChildren:", renderedChildElements);

		return {
			id: id || 'form-engine-root',
			className,
			style,
			submitButtonText,
			submitButtonClassName,
			onFormSubmit: context.onSubmit,
			formData: context.formData,
			isViewMode: context.formMode === "view",
			children: renderedChildElements,
		};
	},
});
