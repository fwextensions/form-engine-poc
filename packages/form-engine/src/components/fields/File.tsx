// packages/form-engine/src/components/fields/File.tsx
import React from "react";
import { z } from "zod";
import { Control } from "@radix-ui/react-form";
import {
	baseFieldConfigSchema,
	commonFieldTransform,
} from "../baseSchemas";
import { createComponent } from "../../core/componentFactory";
import { FormFieldContainer, FormFieldContainerProps } from "../layout/FormFieldContainer";

// 1. Define Configuration Schema
export const FileConfigSchema = baseFieldConfigSchema.extend({
	type: z.literal("file"),
	accept: z.string().optional(), // e.g., "image/*,.pdf"
	multiple: z.boolean().optional(),
	// 'disabled' is now inherited from baseFieldConfigSchema
});
export type FileConfig = z.infer<typeof FileConfigSchema>;

// 2. Define Props for the React Component
export interface FileProps {
	containerProps: Omit<FormFieldContainerProps, "children">;
	inputProps: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue">;
}

// 3. Create the React Component
export const FileComponent: React.FC<FileProps> = ({ containerProps, inputProps }) => {
	return (
		<FormFieldContainer {...containerProps}>
			<Control asChild>
				<input
					{...inputProps}
					type="file"
					className={`mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${inputProps.className || ""}`}
				/>
			</Control>
		</FormFieldContainer>
	);
};

// 4. Register the Component
createComponent<FileConfig, FileProps>({
	type: "file",
	schema: FileConfigSchema,
	component: FileComponent,
	transformProps: (config, context) => {
		const { id, label, description, validation, accept, multiple, disabled: configDisabled } = config;

		// For file inputs, Radix Form expects the 'value' to be a FileList.
		// We don't manage 'value' or 'defaultValue' directly here for controlled component behavior
		// as it's complex with FileList. Radix Form handles this internally when the input changes.
		// The 'required' attribute will be handled by the browser/Radix Form for validation.

		const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
			context.onDataChange(id, event.target.files);
		};

		return {
			containerProps: { name: id, label, description, htmlFor: id },
			inputProps: {
				id,
				name: id,
				onChange: handleChange,
				disabled: context.formMode === "view" || configDisabled,
				required: validation?.required,
				accept,
				multiple,
			},
		};
	},
	transformConfig: commonFieldTransform,
});
