// packages/form-engine/src/components/fields/Text.tsx
import React from "react";
import { z } from "zod";
import { baseFieldConfigSchema } from "../baseSchemas";
import { createComponent, FormEngineContext } from "../../core/componentFactory";
import { FormFieldContainer, FormFieldContainerProps } from "../layout/FormFieldContainer";

// --- TEXT ---
// 1. Define Configuration Schema for Text
export const TextConfigSchema = baseFieldConfigSchema.extend({
	type: z.literal("text"),
	placeholder: z.string().optional(),
	defaultValue: z.string().optional(),
});
export type TextConfig = z.infer<typeof TextConfigSchema>;

// --- EMAIL ---
// 1. Define Configuration Schema for Email
export const EmailConfigSchema = baseFieldConfigSchema.extend({
	type: z.literal("email"),
	placeholder: z.string().optional(),
	defaultValue: z.string().optional(),
});
export type EmailConfig = z.infer<typeof EmailConfigSchema>;

// --- PASSWORD ---
// 1. Define Configuration Schema for Password
export const PasswordConfigSchema = baseFieldConfigSchema.extend({
	type: z.literal("password"),
	placeholder: z.string().optional(),
	defaultValue: z.string().optional(), // Note: defaultValue for password might not be common
});
export type PasswordConfig = z.infer<typeof PasswordConfigSchema>;

// --- TEL ---
// 1. Define Configuration Schema for Tel
export const TelConfigSchema = baseFieldConfigSchema.extend({
	type: z.literal("tel"),
	placeholder: z.string().optional(),
	defaultValue: z.string().optional(),
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
});
export type NumberConfig = z.infer<typeof NumberConfigSchema>;

// 2. Define Props for the React Component (shared for Text, Email, Password, Tel, Number)
export interface TextProps {
	containerProps: Omit<FormFieldContainerProps, "children">;
	inputProps: React.InputHTMLAttributes<HTMLInputElement> & { type: "text" | "email" | "password" | "tel" | "number" };
}

// 3. Create the React Component (shared)
export const Text: React.FC<TextProps> = ({ containerProps, inputProps }) => {
	return (
		<FormFieldContainer {...containerProps}>
			<input
				{...inputProps}
				className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${inputProps.className || ""}`}
			/>
		</FormFieldContainer>
	);
};

// Helper function to create transformProps for string-based text-like inputs
const createStringTransformProps = (inputType: "text" | "email" | "password" | "tel") => {
	return (config: TextConfig | EmailConfig | PasswordConfig | TelConfig, context: FormEngineContext): TextProps => {
		const { id, label, description, placeholder, defaultValue } = config;

		const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
			context.onDataChange(id, event.target.value);
		};

		const messages: FormFieldContainerProps["messages"] = [];

		return {
			containerProps: {
				name: id,
				label,
				description: description,
				htmlFor: id,
				messages: messages,
			},
			inputProps: {
				id,
				name: id,
				type: inputType,
				placeholder,
				value: (context.formData[id] as string) ?? defaultValue ?? "",
				onChange: handleChange,
				"aria-describedby": description ? `${id}-description` : undefined,
				disabled: context.formMode === "view",
			},
		};
	};
};

// 4. Register the TEXT Component
createComponent<TextConfig, TextProps>({
	type: "text",
	schema: TextConfigSchema,
	component: Text,
	transformProps: createStringTransformProps("text"),
});

// 4. Register the EMAIL Component
createComponent<EmailConfig, TextProps>({
	type: "email",
	schema: EmailConfigSchema,
	component: Text, // Reusing the Text component
	transformProps: createStringTransformProps("email"),
});

// 4. Register the PASSWORD Component
createComponent<PasswordConfig, TextProps>({
	type: "password",
	schema: PasswordConfigSchema,
	component: Text, // Reusing the Text component
	transformProps: createStringTransformProps("password"),
});

// 4. Register the TEL Component
createComponent<TelConfig, TextProps>({
	type: "tel",
	schema: TelConfigSchema,
	component: Text, // Reusing the Text component
	transformProps: createStringTransformProps("tel"),
});

// 4. Register the NUMBER Component
createComponent<NumberConfig, TextProps>({
	type: "number",
	schema: NumberConfigSchema,
	component: Text, // Reusing the Text component
	transformProps: (config: NumberConfig, context: FormEngineContext): TextProps => {
		const { id, label, description, placeholder, defaultValue, min, max, step } = config;

		const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
			const rawValue = event.target.value;
			const numValue = rawValue === "" || isNaN(parseFloat(rawValue)) ? undefined : parseFloat(rawValue);
			context.onDataChange(id, numValue);
		};

		const messages: FormFieldContainerProps["messages"] = [];

		let displayValue = "";
		if (context.formData[id] !== undefined && context.formData[id] !== null) {
			displayValue = String(context.formData[id]);
		} else if (defaultValue !== undefined) {
			displayValue = String(defaultValue);
		}

		return {
			containerProps: {
				name: id,
				label,
				description: description,
				htmlFor: id,
				messages: messages,
			},
			inputProps: {
				id,
				name: id,
				type: "number",
				placeholder,
				value: displayValue,
				onChange: handleChange,
				min,
				max,
				step,
				"aria-describedby": description ? `${id}-description` : undefined,
				disabled: context.formMode === "view",
			},
		};
	},
});
