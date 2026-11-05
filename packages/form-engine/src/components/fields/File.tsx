// packages/form-engine/src/components/fields/File.tsx
import React from "react";
import { z } from "zod";
import { Field } from "@base-ui-components/react/field";
import { defineField } from "../../core/defineField";
import { fileInputClassName } from "./styles";

export const FileConfigSchema = defineField<
	{ accept: z.ZodOptional<z.ZodString>; multiple: z.ZodOptional<z.ZodBoolean> },
	FileList | null
>({
	type: "file",
	description: "A file upload input field",
	example: { id: "proofOfIncome", label: "Proof of income", accept: ".pdf,image/*" },
	schema: {
		accept: z.string().optional(), // e.g. "image/*,.pdf"
		multiple: z.boolean().optional(),
	},
	value: { empty: null },
	// File inputs are uncontrolled: the browser owns the FileList, we only
	// report it upward on change.
	control: ({ config, setValue, inputProps }) => (
		<Field.Control
			{...inputProps}
			type="file"
			accept={config.accept}
			multiple={config.multiple}
			onChange={(e) => setValue(e.target.files)}
			className={fileInputClassName}
		/>
	),
}).schema;
export type FileConfig = z.infer<typeof FileConfigSchema>;
