// packages/form-engine/src/core/defineField.tsx
// A field-focused layer over createComponent(). It owns everything every
// field has in common (base schema, label/description container, required
// and disabled handling, value plumbing) so a field file only declares its
// extra props and how to render its control.
import React from "react";
import { z } from "zod";
import { baseFieldConfigSchema, commonFieldTransform, type BaseFieldConfig } from "./baseSchemas";
import { createComponent, type ComponentDefinition, type RenderChildren } from "./componentFactory";
import type { FormEngineContext } from "../engine/FormEngineContext";
import type { ChildrenSpec, ValueSpec } from "../catalog/catalog";
import { scopedId } from "../engine/FormEngineContext";
import { FormFieldContainer, type ConstraintMessages, type FormFieldContainerProps } from "../components/layout/FormFieldContainer";

/** Attributes shared by every native control rendered for a field. */
export interface FieldInputProps {
	id: string;
	name: string;
	required?: boolean;
	disabled: boolean;
	"aria-describedby"?: string;
}

/** What a field's `control` renderer receives. */
export interface FieldControlArgs<Config, Value> {
	/** Validated config, with any dynamic props from rules already merged. */
	config: Config;
	/** The field's data key (`config.id`); `inputProps.id` is the scoped DOM id. */
	id: string;
	/** Current value, falling back to `defaultValue` and then `value.empty`. */
	value: Value;
	setValue: (value: Value) => void;
	/** True in view mode or when the config says `disabled`. */
	disabled: boolean;
	required: boolean;
	/** Ready-to-spread attributes for the primary native control. */
	inputProps: FieldInputProps;
	context: FormEngineContext;
	/** Renders child component configs (only for fields that declare `children`). */
	renderChildren: RenderChildren;
}

export interface DefineFieldArgs<Shape extends z.ZodRawShape, Value> {
	type: string;
	description: string;
	/** Minimal valid configuration, minus `type`. Verified by tests. */
	example: Record<string, unknown>;
	notes?: string;
	/** Props beyond the base field schema. May override base props such as `validation`. */
	schema?: Shape;
	/** Declare when the field contains other components (a repeating group); the schema must then include `children`. */
	children?: ChildrenSpec;
	/** Value semantics; `empty` is also the fallback when nothing is entered. */
	value: ValueSpec & { empty: Value };
	/** Renders the control inside the standard label/description container. */
	control: (args: FieldControlArgs<FieldConfig<Shape>, Value>) => React.ReactNode;
	/**
	 * Where the label is rendered. `"above"` (default) lets the container
	 * render it; `"control"` leaves it to the control (e.g. a checkbox whose
	 * label sits beside the box).
	 */
	labelPlacement?: "above" | "control";
	/** Overrides for the container's native constraint messages (e.g. a field-specific `valueMissing`). */
	messages?: ConstraintMessages;
	/**
	 * Custom validation of the field's current value, run by the form on submit
	 * (and on change afterwards). Return a message to show, or null when valid.
	 */
	validate?: (value: Value, info: { required: boolean; config: FieldConfig<Shape> }) => string | string[] | null;
}

export type FieldConfig<Shape extends z.ZodRawShape> = BaseFieldConfig & { type: string } & z.infer<z.ZodObject<Shape>>;

export interface FieldFrameProps {
	containerProps: Omit<FormFieldContainerProps, "children">;
	control: React.ReactNode;
}

/** Standard wrapper: label, description, control, validation messages. */
export const FieldFrame: React.FC<FieldFrameProps> = ({ containerProps, control }) => (
	<FormFieldContainer {...containerProps}>{control}</FormFieldContainer>
);

/**
 * Defines and registers a field component.
 *
 * ```ts
 * defineField({
 *   type: "textarea",
 *   description: "A multi-line text input field",
 *   example: { id: "comments", label: "Comments" },
 *   schema: { rows: z.number().optional() },
 *   value: { empty: "" },
 *   control: ({ value, setValue, inputProps, config }) => (
 *     <textarea {...inputProps} rows={config.rows} value={value} onChange={(e) => setValue(e.target.value)} />
 *   ),
 * });
 * ```
 */
export function defineField<Shape extends z.ZodRawShape, Value>(
	def: DefineFieldArgs<Shape, Value>,
): ComponentDefinition<FieldConfig<Shape>, FieldFrameProps> {
	const schema = baseFieldConfigSchema.extend({
		type: z.literal(def.type),
		...(def.schema ?? ({} as Shape)),
	});
	const labelPlacement = def.labelPlacement ?? "above";

	return createComponent<FieldConfig<Shape>, FieldFrameProps>({
		type: def.type,
		kind: "field",
		schema: schema as unknown as z.ZodType<FieldConfig<Shape>>,
		component: FieldFrame,
		description: def.description,
		example: def.example as any,
		notes: def.notes,
		value: def.value,
		children: def.children,
		transformConfig: commonFieldTransform,
		transformProps: (config, context, renderChildren) => {
			const { id, label, description, validation } = config;
			// Inside a repeating group the same template renders once per item, so
			// DOM ids and input names carry the item's scope; the data key does not.
			const domId = scopedId(context, id);
			const disabled = context.formMode === "view" || config.disabled === true;
			const required = validation?.required === true;
			const describedBy = description ? `${domId}-description` : undefined;
			const stored = context.formData[id];
			const value = (stored !== undefined ? stored : (config as { defaultValue?: unknown }).defaultValue ?? def.value.empty) as Value;

			const control = def.control({
				config,
				id,
				value,
				setValue: (next) => context.onDataChange(id, next),
				disabled,
				required,
				inputProps: {
					id: domId,
					name: domId,
					required: required || undefined,
					disabled,
					"aria-describedby": describedBy,
				},
				context,
				renderChildren,
			});

			return {
				containerProps: {
					name: domId,
					fieldId: id,
					required,
					label: labelPlacement === "above" ? label : undefined,
					description,
					htmlFor: domId,
					messages: def.messages,
					// Validate the engine's value rather than what Base UI tracked for the
					// control, so fields without a native control (groups) work too.
					validate: def.validate ? () => def.validate!(value, { required, config }) : undefined,
				},
				control,
			};
		},
	});
}
