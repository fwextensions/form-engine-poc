// packages/form-engine/src/components/fields/FileField.tsx
import React from "react";
import { z } from "zod";
import { baseFieldConfigSchema } from "../baseSchemas";
import { createComponent, FormEngineContext } from "../../core/componentFactory";
import { FormFieldContainer, FormFieldContainerProps } from "../layout/FormFieldContainer";

// 1. Define Configuration Schema
export const FileConfigSchema = baseFieldConfigSchema.extend({
	type: z.literal("file"),
	accept: z.string().optional(),
	multiple: z.boolean().optional(),
	// Note: defaultValue for <input type="file"> is not practically supported by browsers for security reasons.
	// validation: z.object({ required: z.boolean().optional() }).optional(),
});
export type FileConfig = z.infer<typeof FileConfigSchema>;

// 2. Define Props for the React Component
export interface FileProps {
	containerProps: Omit<FormFieldContainerProps, "children">;
	inputProps: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue">; // value/defaultValue is not used for file inputs
}

// 3. Create the React Component
// Renamed to FileComponent to avoid potential export name conflicts
export const FileComponent: React.FC<FileProps> = ({ containerProps, inputProps }) => {
	return (
		<FormFieldContainer {...containerProps}>
			<input
				type="file"
				{...inputProps}
				className={`mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed ${inputProps.className || ""}`}
			/>
		</FormFieldContainer>
	);
};

// 4. Register the Component
createComponent<FileConfig, FileProps>({
	type: "file",
	schema: FileConfigSchema,
	component: FileComponent,
	transformProps: (config: FileConfig, context: FormEngineContext): FileProps => {
		const { id, label, description, accept, multiple, type, ...restConfig } = config;

		const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
			// For file inputs, we pass the FileList object
			context.onDataChange(id, event.target.files);
		};

		// The 'value' or 'checked' state for file inputs is managed by the browser.
		// We don't set 'value' here. The context.formData[id] would hold the FileList or file metadata.

		return {
			containerProps: {
				name: id,
				label,
				description: description,
				htmlFor: id,
			},
			inputProps: {
				id,
				name: id,
				accept: accept,
				multiple: multiple,
				onChange: handleChange,
				"aria-describedby": description ? `${id}-description` : undefined,
				disabled: context.formMode === "view",
				// required: config.validation?.required,
			},
		};
	},
});
