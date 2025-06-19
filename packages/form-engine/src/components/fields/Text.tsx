// packages/form-engine/src/components/fields/Text.tsx
import React from "react";
import { z } from "zod";
import { Control } from "@radix-ui/react-form";
import {
	baseFieldConfigSchema,
	commonFieldTransform,
} from "../baseSchemas";
import { createComponent } from "../../core/componentFactory";
import { FormFieldContainer, FormFieldContainerProps } from "../layout/FormFieldContainer";

// --- TEXT ---
// 1. Define Configuration Schema for Text
export const TextConfigSchema = baseFieldConfigSchema.extend({
	type: z.literal("text"),
	placeholder: z.string().optional(),
	defaultValue: z.string().optional(),
	inputType: z.enum(["text", "email", "password", "tel", "url", "number", "date", "datetime-local", "month", "week", "time"]).optional().default("text"),
});
export type TextConfig = z.infer<typeof TextConfigSchema>;

// --- EMAIL ---
// 1. Define Configuration Schema for Email
export const EmailConfigSchema = baseFieldConfigSchema.extend({
	type: z.literal("email"),
	placeholder: z.string().optional(),
	defaultValue: z.string().optional(),
	// Email specific validation can be added here if needed,
	// or rely on Zod's string().email() in a more complex validation object.
	validation: z.object({
		required: z.boolean().optional(), // from base
		email: z.union([z.string(), z.boolean()]).optional(), // For custom email validation message or true
	}).passthrough().optional(),
});
export type EmailConfig = z.infer<typeof EmailConfigSchema>;

// --- PASSWORD ---
// 1. Define Configuration Schema for Password
export const PasswordConfigSchema = baseFieldConfigSchema.extend({
	type: z.literal("password"),
	placeholder: z.string().optional(),
	defaultValue: z.string().optional(),
});
export type PasswordConfig = z.infer<typeof PasswordConfigSchema>;

// --- TEL ---
// 1. Define Configuration Schema for Tel
export const TelConfigSchema = baseFieldConfigSchema.extend({
	type: z.literal("tel"),
	placeholder: z.string().optional(),
	defaultValue: z.string().optional(),
	validation: z.object({
		required: z.boolean().optional(), // from base
		// tel specific validation if any, e.g. pattern
	}).passthrough().optional(),
});
export type TelConfig = z.infer<typeof TelConfigSchema>;

// --- NUMBER ---
// 1. Define Configuration Schema for Number
export const NumberConfigSchema = baseFieldConfigSchema.extend({
	type: z.literal("number"),
	placeholder: z.string().optional(),
	defaultValue: z.number().optional(),
	min: z.number().optional(),
	max: z.number().optional(),
	step: z.number().optional(),
	validation: z.object({
		required: z.boolean().optional(), // from base
		min: z.union([z.number(), z.string()]).optional(), // Allow message for min
		max: z.union([z.number(), z.string()]).optional(), // Allow message for max
	}).passthrough().optional(),
});
export type NumberConfig = z.infer<typeof NumberConfigSchema>;


// 2. Define Props for the React Component (shared by Text, Email, Password, Tel, Number)
export interface TextProps {
	containerProps: Omit<FormFieldContainerProps, "children">;
	inputProps: React.InputHTMLAttributes<HTMLInputElement>;
}

// 3. Create the React Component (shared by Text, Email, Password, Tel, Number)
export const Text: React.FC<TextProps> = ({ containerProps, inputProps }) => {
	return (
		<FormFieldContainer {...containerProps}>
			<Control asChild>
				<input
					{...inputProps}
					className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${inputProps.className || ""}`}
				/>
			</Control>
		</FormFieldContainer>
	);
};

// 4. Register Components

// TEXT
createComponent<TextConfig, TextProps>({
	type: "text",
	schema: TextConfigSchema,
	component: Text,
	transformConfig: commonFieldTransform,
	transformProps: (config, context) => {
		const { id, label, description, placeholder, defaultValue, validation, type, disabled } = config;
		return {
			containerProps: { name: id, label, description, htmlFor: id },
			inputProps: {
				type,
				id,
				name: id,
				placeholder,
				value: context.formData[id] ?? defaultValue ?? "",
				onChange: (e) => context.onDataChange(id, e.target.value),
				disabled: context.formMode === "view" || disabled,
				required: validation?.required,
			},
		};
	},
});

// EMAIL
createComponent<EmailConfig, TextProps>({
	type: "email",
	schema: EmailConfigSchema,
	component: Text,
	transformConfig: commonFieldTransform,
	transformProps: (config, context) => {
		const { id, label, description, placeholder, defaultValue, validation, type, disabled } = config;
		return {
			containerProps: { name: id, label, description, htmlFor: id },
			inputProps: {
				type,
				id,
				name: id,
				placeholder,
				value: context.formData[id] ?? defaultValue ?? "",
				onChange: (e) => context.onDataChange(id, e.target.value),
				disabled: context.formMode === "view" || disabled,
				required: validation?.required,
			},
		};
	},
});

// PASSWORD
createComponent<PasswordConfig, TextProps>({
	type: "password",
	schema: PasswordConfigSchema,
	component: Text,
	transformConfig: commonFieldTransform,
	transformProps: (config, context) => {
		const { id, label, description, placeholder, defaultValue, validation, type, disabled } = config;
		return {
			containerProps: { name: id, label, description, htmlFor: id },
			inputProps: {
				type,
				id,
				name: id,
				placeholder,
				value: context.formData[id] ?? defaultValue ?? "",
				onChange: (e) => context.onDataChange(id, e.target.value),
				disabled: context.formMode === "view" || disabled,
				required: validation?.required,
			},
		};
	},
});

// TEL
createComponent<TelConfig, TextProps>({
	type: "tel",
	schema: TelConfigSchema,
	component: Text,
	transformConfig: commonFieldTransform,
	transformProps: (config, context) => {
		const { id, label, description, placeholder, defaultValue, validation, type, disabled } = config;
		return {
			containerProps: { name: id, label, description, htmlFor: id },
			inputProps: {
				type,
				id,
				name: id,
				placeholder,
				value: context.formData[id] ?? defaultValue ?? "",
				onChange: (e) => context.onDataChange(id, e.target.value),
				disabled: context.formMode === "view" || disabled,
				required: validation?.required,
			},
		};
	},
});

// NUMBER
createComponent<NumberConfig, TextProps>({
	type: "number",
	schema: NumberConfigSchema,
	component: Text,
	transformConfig: commonFieldTransform,
	transformProps: (config, context) => {
		const { id, label, description, placeholder, defaultValue, validation, type, min, max, step, disabled } = config;
		return {
			containerProps: { name: id, label, description, htmlFor: id },
			inputProps: {
				type,
				id,
				name: id,
				placeholder,
				value: context.formData[id] ?? defaultValue ?? "", // Number input handles empty string for no value
				onChange: (e) => {
					// For number, ensure we store a number or undefined if empty
					const numValue = e.target.valueAsNumber;
					context.onDataChange(id, isNaN(numValue) ? undefined : numValue);
				},
				min,
				max,
				step,
				disabled: context.formMode === "view" || disabled,
				required: validation?.required,
			},
		};
	},
});
