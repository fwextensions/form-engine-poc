import React from "react";
import * as Form from "@radix-ui/react-form";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { FieldComponent, FieldDefinition } from "./types";
import fieldRegistry from "./FieldRegistry";
import { formMessageStyles, labelStyles } from "./styles";

const radioItemStyles = "relative h-4 w-4 rounded-full border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600";
const radioIndicatorStyles = "absolute inset-0 flex items-center justify-center";

const RadioComponent: FieldComponent = ({ field, value, onChange, className }) => {
  const options = field.options || [];
  
  return (
    <RadioGroupPrimitive.Root
      className={`flex flex-col gap-3 ${className || ""}`}
      value={value}
      onValueChange={onChange}
      disabled={field.disabled}
      aria-label={field.label}
      required={field.validation?.required}
    >
      {options.map((option) => (
        <div key={option.value} className="flex items-center">
          <Form.Control asChild>
            <RadioGroupPrimitive.Item
              value={option.value}
              className={radioItemStyles}
              disabled={field.disabled}
              style={field.style}
            >
              <RadioGroupPrimitive.Indicator className={radioIndicatorStyles}>
                <div className="h-2 w-2 rounded-full bg-white" />
              </RadioGroupPrimitive.Indicator>
            </RadioGroupPrimitive.Item>
          </Form.Control>
          <Form.Label 
            className={`ml-2 text-sm font-medium ${field.disabled ? 'text-gray-400' : 'text-gray-700'}`}
            style={field.style}
          >
            {option.label}
          </Form.Label>
        </div>
      ))}
    </RadioGroupPrimitive.Root>
  );
};

const renderField: FieldDefinition['render'] = (props) => {
  const { field } = props;
  
  return (
    <Form.Field 
      name={field.id} 
      className={`mb-4 ${field.className || ''}`}
      style={field.style}
    >
      <div className="flex items-baseline justify-between">
        {field.label && (
          <Form.Label className={labelStyles}>
            {field.label}
          </Form.Label>
        )}
        <Form.Message className={formMessageStyles} match="valueMissing">
          {field.label ? `${field.label} is required` : 'Please select an option'}
        </Form.Message>
      </div>
      <RadioComponent {...props} />
      {field.description && (
        <div className="mt-1 text-sm text-gray-500">
          {field.description}
        </div>
      )}
    </Form.Field>
  );
};

const RadioField: FieldDefinition = {
  component: RadioComponent,
  render: renderField,
};

// Register the field type
fieldRegistry.registerField("radio", RadioField);

export default RadioField;
