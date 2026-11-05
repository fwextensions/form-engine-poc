// packages/form-engine/src/components/fields/Textarea.tsx
import React from "react";
import { z } from "zod";
import { Control } from "@radix-ui/react-form";
import { defineField } from "../../core/defineField";
import { inputClassName } from "./styles";

export const TextareaConfigSchema = defineField({
	type: "textarea",
	description: "A multi-line text input field",
	example: { id: "comments", label: "Additional comments", rows: 4 },
	schema: {
		placeholder: z.string().optional(),
		defaultValue: z.string().optional(),
		rows: z.number().optional(),
	},
	value: { empty: "" },
	control: ({ config, value, setValue, inputProps }) => (
		<Control asChild>
			<textarea
				{...inputProps}
				placeholder={config.placeholder}
				rows={config.rows}
				value={value}
				onChange={(e) => setValue(e.target.value)}
				className={inputClassName}
			/>
		</Control>
	),
}).schema;
export type TextareaConfig = z.infer<typeof TextareaConfigSchema>;
