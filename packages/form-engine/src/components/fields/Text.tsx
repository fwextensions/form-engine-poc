// packages/form-engine/src/components/fields/Text.tsx
// The single-line input family: text, email, password, tel, number.
import React from "react";
import { z } from "zod";
import { Control } from "@radix-ui/react-form";
import { defineField } from "../../core/defineField";
import { numberValidationSchema, textValidationSchema } from "../../core/baseSchemas";
import { inputClassName } from "./styles";

const inputTypes = ["text", "email", "password", "tel", "url", "number", "date", "datetime-local", "month", "week", "time"] as const;
export type InputType = (typeof inputTypes)[number];

const textLikeShape = {
	placeholder: z.string().optional(),
	defaultValue: z.string().optional(),
	validation: textValidationSchema.optional(),
};

type TextValidation = z.infer<typeof textValidationSchema> | undefined;

/** Native constraint attributes derived from `validation`. */
function constraintAttrs(validation: TextValidation) {
	return {
		minLength: validation?.minLength,
		maxLength: validation?.maxLength,
		pattern: validation?.pattern,
	};
}

/** Shared control for every string-valued single-line input. */
function StringInput({
	inputType,
	value,
	setValue,
	inputProps,
	placeholder,
}: {
	inputType: InputType;
	value: string;
	setValue: (v: string) => void;
	inputProps: React.InputHTMLAttributes<HTMLInputElement>;
	placeholder?: string;
}) {
	return (
		<Control asChild>
			<input
				{...inputProps}
				type={inputType}
				placeholder={placeholder}
				value={value}
				onChange={(e) => setValue(e.target.value)}
				className={inputClassName}
			/>
		</Control>
	);
}

// --- TEXT ---
export const TextConfigSchema = defineField({
	type: "text",
	description: "A single-line text input field",
	example: { id: "firstName", label: "First name*", placeholder: "Jane" },
	notes: "Set `inputType` to use a native HTML input type such as `url` or `time` without a dedicated component.",
	schema: {
		...textLikeShape,
		inputType: z.enum(inputTypes).optional().default("text"),
	},
	value: { empty: "" },
	control: ({ config, value, setValue, inputProps }) => (
		<StringInput inputType={config.inputType ?? "text"} value={value} setValue={setValue} inputProps={{ ...inputProps, ...constraintAttrs(config.validation) }} placeholder={config.placeholder} />
	),
}).schema;
export type TextConfig = z.infer<typeof TextConfigSchema>;

// --- EMAIL ---
export const EmailConfigSchema = defineField({
	type: "email",
	description: "An email input field with email validation",
	example: { id: "email", label: "Email address*" },
	schema: {
		...textLikeShape,
		validation: textValidationSchema.extend({
			email: z.union([z.string(), z.boolean()]).optional().describe("Validate the address format; a string is used as the error message"),
		}).optional(),
	},
	value: { empty: "" },
	control: ({ config, value, setValue, inputProps }) => (
		<StringInput inputType="email" value={value} setValue={setValue} inputProps={{ ...inputProps, ...constraintAttrs(config.validation) }} placeholder={config.placeholder} />
	),
}).schema;
export type EmailConfig = z.infer<typeof EmailConfigSchema>;

// --- PASSWORD ---
export const PasswordConfigSchema = defineField({
	type: "password",
	description: "A password input field with masked characters",
	example: { id: "password", label: "Password*" },
	schema: textLikeShape,
	value: { empty: "" },
	control: ({ config, value, setValue, inputProps }) => (
		<StringInput inputType="password" value={value} setValue={setValue} inputProps={{ ...inputProps, ...constraintAttrs(config.validation) }} placeholder={config.placeholder} />
	),
}).schema;
export type PasswordConfig = z.infer<typeof PasswordConfigSchema>;

// --- TEL ---
export const TelConfigSchema = defineField({
	type: "tel",
	description: "A telephone number input field",
	example: { id: "phone", label: "Phone number" },
	schema: textLikeShape,
	value: { empty: "" },
	control: ({ config, value, setValue, inputProps }) => (
		<StringInput inputType="tel" value={value} setValue={setValue} inputProps={{ ...inputProps, ...constraintAttrs(config.validation) }} placeholder={config.placeholder} />
	),
}).schema;
export type TelConfig = z.infer<typeof TelConfigSchema>;

// --- NUMBER ---
export const NumberConfigSchema = defineField<
	{
		placeholder: z.ZodOptional<z.ZodString>;
		defaultValue: z.ZodOptional<z.ZodNumber>;
		min: z.ZodOptional<z.ZodNumber>;
		max: z.ZodOptional<z.ZodNumber>;
		step: z.ZodOptional<z.ZodNumber>;
		validation: z.ZodOptional<typeof numberValidationSchema>;
	},
	number | undefined
>({
	type: "number",
	description: "A numeric input field with optional min/max/step constraints",
	example: { id: "householdSize", label: "Household size*", min: 1, max: 20 },
	schema: {
		placeholder: z.string().optional(),
		defaultValue: z.number().optional(),
		min: z.number().optional(),
		max: z.number().optional(),
		step: z.number().optional(),
		validation: numberValidationSchema.optional(),
	},
	notes: "`min`/`max`/`step` on the field and `validation.min`/`validation.max` both constrain the value; the field-level props win when both are set.",
	value: { empty: undefined },
	control: ({ config, value, setValue, inputProps }) => (
		<Control asChild>
			<input
				{...inputProps}
				type="number"
				placeholder={config.placeholder}
				min={config.min ?? config.validation?.min}
				max={config.max ?? config.validation?.max}
				step={config.step}
				value={value ?? ""}
				onChange={(e) => {
					const numValue = e.target.valueAsNumber;
					setValue(Number.isNaN(numValue) ? undefined : numValue);
				}}
				className={inputClassName}
			/>
		</Control>
	),
}).schema;
export type NumberConfig = z.infer<typeof NumberConfigSchema>;
