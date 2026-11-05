// packages/form-engine/src/components/fields/Textarea.tsx
import React from "react";
import { z } from "zod";
import { Field } from "@base-ui-components/react/field";
import { defineField } from "../../core/defineField";
import { textValidationSchema } from "../../core/baseSchemas";
import { inputClassName } from "./styles";

export const TextareaConfigSchema = defineField({
	type: "textarea",
	description: "A multi-line text input field",
	example: { id: "comments", label: "Additional comments", rows: 4 },
	schema: {
		placeholder: z.string().optional(),
		defaultValue: z.string().optional(),
		rows: z.number().optional(),
		validation: textValidationSchema.optional(),
	},
	value: { empty: "" },
	control: ({ config, value, setValue, inputProps }) => (
		<Field.Control
			{...inputProps}
			render={<textarea rows={config.rows} />}
			placeholder={config.placeholder}
			minLength={config.validation?.minLength}
			maxLength={config.validation?.maxLength}
			value={value}
			onChange={(e) => setValue(e.target.value)}
			className={inputClassName}
		/>
	),
}).schema;
export type TextareaConfig = z.infer<typeof TextareaConfigSchema>;
