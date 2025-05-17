import React from "react";
import { Field, Label, Message } from "@radix-ui/react-form";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { FieldComponent, FieldDefinition } from "./types";
import fieldRegistry from "./FieldRegistry";
import { labelStyles, formMessageStyles } from "./styles";

const RadioComponent: FieldComponent = ({ field, value, onChange, className }) => {
  const options = field.options || [];

  return (
    <RadioGroup.Root
      className={`flex flex-col gap-3 ${className || ""}`}
      value={value}
      onValueChange={onChange}
      disabled={field.disabled}
      aria-label={field.label}
      required={field.validation?.required}
    >
      {options.map((option) => (
        <div key={option.value} className="flex items-center">
          <RadioGroup.Item
            value={option.value}
            id={`${field.id}-${option.value}`}
            className="relative h-4 w-4 rounded-full border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
            disabled={field.disabled}
            style={field.style}
          >
            <RadioGroup.Indicator className="flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-white" />
            </RadioGroup.Indicator>
          </RadioGroup.Item>
          <Label
            htmlFor={`${field.id}-${option.value}`}
            className={`ml-2 text-sm font-medium ${field.disabled ? 'text-gray-400' : 'text-gray-700 cursor-pointer'}`}
            style={field.style}
          >
            {option.label}
          </Label>
        </div>
      ))}
    </RadioGroup.Root>
  );
};

const renderField: FieldDefinition['render'] = (props) => {
  const { field } = props;

  return (
    <Field
      name={field.id}
      className={`mb-4 grid ${field.className || ''}`}
      style={field.style}
    >
      <div className="flex items-baseline justify-between">
        {field.label && (
          <Label className={labelStyles}>
            {field.label}
          </Label>
        )}
        <Message className={formMessageStyles} match="valueMissing">
          {field.label ? `${field.label} is required` : 'Please select an option'}
        </Message>
      </div>
      <RadioComponent {...props} />
      {field.description && (
        <div className="mt-1 text-sm text-gray-500">
          {field.description}
        </div>
      )}
    </Field>
  );
};

const RadioField: FieldDefinition = {
  component: RadioComponent,
  render: renderField,
};

fieldRegistry.registerField("radio", RadioField);

export default RadioField;
