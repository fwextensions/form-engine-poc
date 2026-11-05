// packages/form-engine/src/components/fields/DatePicker.tsx
import React from "react";
import { z } from "zod";
import { Field } from "@base-ui-components/react/field";
import { defineField } from "../../core/defineField";
import { inputClassName } from "./styles";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected an ISO date (YYYY-MM-DD)");

export const DatePickerConfigSchema = defineField({
	type: "date",
	description: "A date picker input field (values are ISO dates, YYYY-MM-DD)",
	example: { id: "moveInDate", label: "Preferred move-in date*" },
	notes: "For birth dates use `dateOfBirth`, which has month/day/year inputs and age limits.",
	schema: {
		placeholder: z.string().optional(), // native date inputs ignore it, kept for parity
		defaultValue: isoDate.optional(),
		min: isoDate.optional(),
		max: isoDate.optional(),
	},
	value: { empty: "" },
	control: ({ config, value, setValue, inputProps }) => (
		<Field.Control
			{...inputProps}
			type="date"
			placeholder={config.placeholder}
			min={config.min}
			max={config.max}
			value={value}
			onChange={(e) => setValue(e.target.value)}
			className={inputClassName}
		/>
	),
}).schema;
export type DatePickerConfig = z.infer<typeof DatePickerConfigSchema>;
