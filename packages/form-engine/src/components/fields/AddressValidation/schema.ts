import { z } from "zod";
import {
	baseFieldConfigSchema,
	commonFieldTransform,
} from "../../../core/baseSchemas";

// 1. Define Configuration Schema
export const addressValidationFieldConfigSchema = baseFieldConfigSchema.extend({
	type: z.literal("addressValidation"),
	// Future component-specific configurations can be added here
});

export const transformConfig = commonFieldTransform;

export type AddressValidationFieldConfig = z.infer<
	typeof addressValidationFieldConfigSchema
>;
