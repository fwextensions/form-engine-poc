// packages/form-engine/src/components/fields/Repeater.tsx
// A repeating group: the `children` are a template of fields that the user
// can add as many times as needed ("add another household member"). The
// value is an array with one object per item, keyed by the template's ids.
//
// Each item renders the template inside its own engine context: reads and
// writes go to the item's object, DOM ids and input names are scoped by
// item, and rules on template fields are evaluated against the item's data
// (with the outer form data visible underneath it).
import React, { useState } from "react";
import { z } from "zod";
import { defineField, type FieldConfig, type FieldControlArgs } from "../../core/defineField";
import { FormEngineProvider, type FormEngineContext } from "../../engine/FormEngineContext";
import { useFormRules } from "../../hooks/useFormRules";
import type { RenderChildren } from "../../core/componentFactory";
import type { FormConfig } from "../layout/Form";

export type RepeaterItem = Record<string, unknown>;

/** Normalises a stored value to an array of item objects. */
export function itemsFromValue(value: unknown): RepeaterItem[] {
	return Array.isArray(value) ? value.map((item) => (item && typeof item === "object" ? (item as RepeaterItem) : {})) : [];
}

/** The items to show: the stored ones, padded with blanks up to `minItems`. */
export function padItems(items: RepeaterItem[], minItems: number): RepeaterItem[] {
	if (items.length >= minItems) return items;
	return [...items, ...Array.from({ length: minItems - items.length }, () => ({}))];
}

/** Message for the group's own constraints, or null. Item fields validate themselves. */
export function repeaterProblem(items: RepeaterItem[], config: { required: boolean; minItems: number; maxItems?: number; itemLabel: string }): string | null {
	const shown = padItems(items, config.minItems).length;
	if (config.required && shown === 0) return `Add at least one ${config.itemLabel.toLowerCase()}.`;
	if (config.maxItems !== undefined && shown > config.maxItems) return `You can add up to ${config.maxItems} ${config.itemLabel.toLowerCase()}${config.maxItems === 1 ? "" : "s"}.`;
	return null;
}

interface ItemProps {
	index: number;
	item: RepeaterItem;
	template: unknown[];
	parent: FormEngineContext;
	scope: string;
	onChange: (item: RepeaterItem) => void;
	renderChildren: RenderChildren;
}

/** One item of the group: a nested engine context over the item's object. */
function RepeaterItemFields({ index, item, template, parent, scope, onChange, renderChildren }: ItemProps) {
	// Rules on template fields see the item's data on top of the outer form's.
	const data = { ...parent.formData, ...item };
	const templateSchema = { type: "form", children: template } as FormConfig;
	const dynamicProps = useFormRules(templateSchema, data, parent.formContext);
	const context: FormEngineContext = {
		...parent,
		scope: `${scope}-${index}`,
		formData: data,
		onDataChange: (fieldId, value) => onChange({ ...item, [fieldId]: value }),
		dynamicProps,
	};
	return <FormEngineProvider value={context}>{renderChildren(template, context)}</FormEngineProvider>;
}

const repeaterShape = {
	children: z.array(z.any()).optional().describe("Template fields rendered once per item"),
	itemLabel: z.string().optional().default("Item").describe("Heading for each item, numbered (\"Household member 1\")"),
	addButtonText: z.string().optional().describe("Text of the add button; defaults to \"Add <itemLabel>\""),
	removeButtonText: z.string().optional().default("Remove"),
	minItems: z.number().int().nonnegative().optional().default(0).describe("Items always shown and not removable"),
	maxItems: z.number().int().positive().optional().describe("Hide the add button at this many items"),
	defaultValue: z.array(z.record(z.string(), z.any())).optional().describe("Initial items, keyed by child field id"),
};

function RepeaterControl({ config, value, setValue, disabled, inputProps, context, renderChildren }: FieldControlArgs<FieldConfig<typeof repeaterShape>, RepeaterItem[]>) {
	const stored = itemsFromValue(value);
	const items = padItems(stored, config.minItems);
	// Stable React keys per item so removing one does not remount the rest.
	const [keys, setKeys] = useState<number[]>(() => items.map((_, i) => i));
	const keyFor = (i: number) => keys[i] ?? -1 - i;
	const nextKey = () => (keys.length ? Math.max(...keys) + 1 : 0);

	const template = config.children ?? [];
	const label = config.itemLabel;
	const canAdd = !disabled && (config.maxItems === undefined || items.length < config.maxItems);
	const canRemove = !disabled && items.length > config.minItems;

	const update = (index: number, item: RepeaterItem) => {
		const next = items.slice();
		next[index] = item;
		setValue(next);
	};
	const add = () => {
		setKeys([...items.map((_, i) => keyFor(i)), nextKey()]);
		setValue([...items, {}]);
	};
	const remove = (index: number) => {
		setKeys(items.map((_, i) => keyFor(i)).filter((_, i) => i !== index));
		setValue(items.filter((_, i) => i !== index));
	};

	return (
		<div role="group" aria-labelledby={`${inputProps.id}-label`} aria-describedby={inputProps["aria-describedby"]} className="mt-1.5 space-y-4">
			{items.map((item, index) => (
				<div key={keyFor(index)} data-repeater-item={index} className="rounded border border-ink-200 bg-ink-50/40 p-4">
					<div className="flex items-center justify-between mb-3">
						<h4 className="text-sm font-semibold text-ink-800">
							{label} {index + 1}
						</h4>
						{canRemove && (
							<button type="button" onClick={() => remove(index)} className="text-sm text-danger-500 hover:underline" aria-label={`${config.removeButtonText} ${label.toLowerCase()} ${index + 1}`}>
								{config.removeButtonText}
							</button>
						)}
					</div>
					<RepeaterItemFields index={index} item={item} template={template} parent={context} scope={inputProps.id} onChange={(next) => update(index, next)} renderChildren={renderChildren} />
				</div>
			))}
			{canAdd && (
				<button type="button" onClick={add} className="px-3 py-1.5 text-sm font-medium text-primary-700 bg-primary-50 border border-primary-200 rounded hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-500">
					{config.addButtonText ?? `Add ${label.toLowerCase()}`}
				</button>
			)}
		</div>
	);
}

export const RepeaterConfigSchema = defineField<typeof repeaterShape, RepeaterItem[]>({
	type: "repeater",
	description: "A repeating group of fields the user can add and remove (\"add another household member\"); the value is an array with one object per item, keyed by the child field ids",
	example: {
		id: "householdMembers",
		label: "Other household members",
		itemLabel: "Household member",
		addButtonText: "Add another household member",
		children: [
			{ type: "name", id: "memberName", label: "Name*" },
			{ type: "dateOfBirth", id: "memberDob", label: "Date of birth*" },
		],
	},
	notes: "Put the fields for one item in `children`; their ids are unique within the item, not the form. `minItems` items are always shown; `validation.required: true` means at least one item. Rules on child fields see the item's own values first, then the rest of the form.",
	schema: repeaterShape,
	children: { allow: "any", deny: ["form", "page", "reviewPage"] },
	value: {
		empty: [],
		display: (value, config) => {
			const count = itemsFromValue(value).length;
			if (count === 0) return null;
			const label = String(config.itemLabel ?? "Item").toLowerCase();
			return `${count} ${label}${count === 1 ? "" : "s"}`;
		},
	},
	validate: (value, { required, config }) => repeaterProblem(itemsFromValue(value), { required, minItems: config.minItems ?? 0, maxItems: config.maxItems, itemLabel: config.itemLabel ?? "Item" }),
	control: (args) => <RepeaterControl {...args} />,
}).schema;
export type RepeaterConfig = z.infer<typeof RepeaterConfigSchema>;
