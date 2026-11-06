// packages/form-engine/src/components/fields/Name.tsx
// A person's name as one field with first / middle / last parts.
// Value: { first: string; middle?: string; last: string }.
import React from "react";
import { z } from "zod";
import { defineField } from "../../core/defineField";
import { SubField } from "./composite";

export interface NameValue {
	first: string;
	middle?: string;
	last: string;
}

const EMPTY: NameValue = { first: "", middle: "", last: "" };

const nameValueSchema = z.object({
	first: z.string().optional(),
	middle: z.string().optional(),
	last: z.string().optional(),
}).strict();

export const NameConfigSchema = defineField<
	{
		showMiddleName: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
		defaultValue: z.ZodOptional<typeof nameValueSchema>;
	},
	NameValue
>({
	type: "name",
	description: "A person's name collected as first, middle (optional) and last name; the value is an object { first, middle, last }",
	example: { id: "applicantName", label: "Your name*" },
	notes: "When the field is required, first and last name are required and middle name stays optional. Set `showMiddleName: false` to hide the middle name input.",
	schema: {
		showMiddleName: z.boolean().optional().default(true),
		defaultValue: nameValueSchema.optional(),
	},
	value: {
		empty: EMPTY,
		display: (v) => {
			const parts = v && typeof v === "object" ? (v as Partial<NameValue>) : {};
			const text = [parts.first, parts.middle, parts.last].map((p) => (p ?? "").trim()).filter(Boolean).join(" ");
			return text || null;
		},
	},
	control: ({ config, value, setValue, disabled, required, inputProps }) => {
		const current: NameValue = { ...EMPTY, ...(value ?? {}) };
		const update = (part: keyof NameValue, text: string) => setValue({ ...current, [part]: text });
		const showMiddle = config.showMiddleName !== false;

		return (
			<div
				role="group"
				aria-labelledby={`${inputProps.id}-label`}
				aria-describedby={inputProps["aria-describedby"]}
				className={`mt-1.5 grid gap-3 ${showMiddle ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
			>
				<SubField fieldId={inputProps.id} part="first" label="First name" autoComplete="given-name" required={required} disabled={disabled} value={current.first} onChange={(e) => update("first", e.target.value)} />
				{showMiddle && (
					<SubField fieldId={inputProps.id} part="middle" label="Middle name (optional)" autoComplete="additional-name" disabled={disabled} value={current.middle ?? ""} onChange={(e) => update("middle", e.target.value)} />
				)}
				<SubField fieldId={inputProps.id} part="last" label="Last name" autoComplete="family-name" required={required} disabled={disabled} value={current.last} onChange={(e) => update("last", e.target.value)} />
			</div>
		);
	},
}).schema;
export type NameConfig = z.infer<typeof NameConfigSchema>;
