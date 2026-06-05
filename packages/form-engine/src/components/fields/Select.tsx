// packages/form-engine/src/components/fields/Select.tsx
import React from "react";
import { z } from "zod";
import * as SelectPrimitive from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";
import {
	baseFieldConfigSchema,
	commonFieldTransform,
} from "../../core/baseSchemas";
import { createComponent } from "../../core/componentFactory";
import { FormFieldContainer, FormFieldContainerProps } from "../layout/FormFieldContainer";
import { serializeForUI, deserializeFromUI } from "../../utils/valueSerialization";

// 1. Define Configuration Schema
const optionSchema = z.object({
    label: z.string().describe("Display text shown in the dropdown"),
    value: z.any().describe("The value submitted when this option is selected. Can be string, number, or boolean."),
});
type UISerialOption = { label: string; value: string };

// Options can be either full {label, value} objects or plain strings (where the string is used as both label and value)
const optionInputSchema = z.union([
    optionSchema,
    z.string().describe("Shorthand: a plain string is used as both the label and value"),
]);

export const SelectConfigSchema = baseFieldConfigSchema.extend({
    type: z.literal("select"),
    options: z.array(optionInputSchema).describe(
        "List of dropdown options. Each option is either a {label, value} object or a plain string. Example: [{label: 'California', value: 'CA'}, {label: 'Nevada', value: 'NV'}] or ['Option A', 'Option B']"
    ),
    placeholder: z.string().optional(),
    defaultValue: z.any().optional(),
});
export type SelectConfig = z.infer<typeof SelectConfigSchema>;

// 2. Define Props for the React Component
export interface SelectProps {
    containerProps: Omit<FormFieldContainerProps, "children">;
    selectRootProps: SelectPrimitive.SelectProps & { id?: string; required?: boolean; disabled?: boolean };
    options: UISerialOption[];
    placeholder?: string;
}

// 3. Create the React Component
export const Select: React.FC<SelectProps> = ({
    containerProps,
    selectRootProps,
    options,
    placeholder,
}) => {
    return (
        <FormFieldContainer {...containerProps}>
            <SelectPrimitive.Root {...selectRootProps}>
                <SelectPrimitive.Trigger
                    id={selectRootProps.id} // Ensure id is on the trigger for label association
                    className="mt-1 inline-flex items-center justify-between rounded-md px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 shadow-sm hover:bg-gray-50 focus:outline-none focus:border-indigo-500 w-full disabled:bg-gray-100 disabled:cursor-not-allowed"
                    aria-required={selectRootProps.required}
                    disabled={selectRootProps.disabled}
                >
                    <SelectPrimitive.Value placeholder={placeholder} />
                    <SelectPrimitive.Icon className="ml-2">
                        <ChevronDownIcon />
                    </SelectPrimitive.Icon>
                </SelectPrimitive.Trigger>
                <SelectPrimitive.Portal>
                    <SelectPrimitive.Content
                        position="popper"
                        sideOffset={5}
                        className="w-[var(--radix-select-trigger-width)] overflow-hidden bg-white rounded-md shadow-lg ring-1 ring-gray-300 z-50"
                        onKeyDown={(event: React.KeyboardEvent) => {
                            if (event.key === 'Enter') {
                                // Prevent Enter from submitting the form when selecting an item
                                event.preventDefault();
                            }
                        }}
                    >
                        <SelectPrimitive.ScrollUpButton className="flex items-center justify-center h-6 bg-white text-gray-700 cursor-default">
                            <ChevronUpIcon />
                        </SelectPrimitive.ScrollUpButton>
                        <SelectPrimitive.Viewport className="p-1">
                            {options.map((option) => (
                                <SelectPrimitive.Item
                                    key={option.value}
                                    value={option.value}
                                    className="relative flex items-center px-8 py-2 rounded-sm text-sm text-gray-900 select-none hover:bg-indigo-500 hover:text-white focus:bg-indigo-500 focus:text-white"
                                >
                                    <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                                    <SelectPrimitive.ItemIndicator className="absolute left-2 inline-flex items-center">
                                        <CheckIcon />
                                    </SelectPrimitive.ItemIndicator>
                                </SelectPrimitive.Item>
                            ))}
                        </SelectPrimitive.Viewport>
                        <SelectPrimitive.ScrollDownButton className="flex items-center justify-center h-6 bg-white text-gray-700 cursor-default">
                            <ChevronDownIcon />
                        </SelectPrimitive.ScrollDownButton>
                    </SelectPrimitive.Content>
                </SelectPrimitive.Portal>
            </SelectPrimitive.Root>
        </FormFieldContainer>
    );
};

// 4. Register the Component (schema is colocated, auto-registered to catalog)
createComponent<SelectConfig, SelectProps>({
    type: "select",
    schema: SelectConfigSchema,
    component: Select,
    description: `A dropdown select field for choosing from predefined options.

Options format — prefer the full object form:
  options:
    - label: "California"
      value: CA
    - label: "Nevada"
      value: NV

Plain strings are also accepted and will use the string as both label and value:
  options:
    - California
    - Nevada`,
    transformConfig: commonFieldTransform,
    transformProps: (config, context) => {
        const { id, label, description, options, placeholder, defaultValue, validation, disabled } = config;

        // Normalize string shorthand to full {label, value} objects
        const normalizedOptions = options.map((o) =>
            typeof o === "string" ? { label: o, value: o } : o
        );

        const uiOptions: UISerialOption[] = normalizedOptions.map((o) => ({ label: o.label, value: serializeForUI(o.value) }));
        const rawValue = context.formData[id] ?? defaultValue ?? undefined;
        const value = rawValue !== undefined ? serializeForUI(rawValue) : undefined;

        return {
            containerProps: { name: id, label, description, htmlFor: id },
            selectRootProps: {
                id,
                name: id,
                value,
                onValueChange: (v) => context.onDataChange(id, deserializeFromUI(v)),
                disabled: context.formMode === "view" || disabled,
                required: validation?.required,
            },
            options: uiOptions,
            placeholder,
        };
    },
});
