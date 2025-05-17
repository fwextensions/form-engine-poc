import React from "react";
import * as Form from "@radix-ui/react-form";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "@radix-ui/react-icons"; 
import { FieldComponent, FieldDefinition } from "./types";
import fieldRegistry from "./FieldRegistry";
import { formMessageStyles, labelStyles } from "./styles";

const CheckboxComponent: FieldComponent = ({ field, value, onChange, className }) => {
  const isChecked = !!value;
  const isDisabled = field.disabled || field.readOnly;
  
  const handleCheckedChange = (checked: boolean | 'indeterminate') => {
    if (typeof checked === 'boolean') {
      onChange?.(checked);
    }
  };

  return (
    <div className="flex items-start gap-3">
      <Form.Control asChild>
        <CheckboxPrimitive.Root
          id={field.id} 
          checked={isChecked}
          onCheckedChange={handleCheckedChange}
          disabled={isDisabled}
          required={field.validation?.required}
          className={`
            flex-shrink-0 w-5 h-5 rounded flex items-center justify-center 
            transition-colors duration-200
            border
            ${isDisabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}
            ${isChecked 
              ? 'bg-blue-600 border-blue-600 text-white' 
              : 'border-gray-300 bg-white hover:border-blue-500 text-transparent'
            }
            ${isDisabled && !isChecked ? 'bg-gray-100 border-gray-300' : ''}
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${className || ''}
          `}
          style={field.style}
        >
          <CheckboxPrimitive.Indicator className="flex items-center justify-center w-full h-full">
            <CheckIcon className="w-4 h-4" />
          </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
      </Form.Control>
      
      <div className="flex-1">
        {field.label && (
          <Form.Label 
            htmlFor={field.id} 
            className={`block text-sm font-medium ${ 
              isDisabled ? 'text-gray-400' : 'text-gray-700 cursor-pointer'
            }`}
          >
            {field.label}
          </Form.Label>
        )}
        {field.description && (
          <div className="mt-1 text-sm text-gray-500">
            {field.description}
          </div>
        )}
      </div>
    </div>
  );
};

const renderField: FieldDefinition['render'] = (props) => {
  const { field } = props;
  const isRequired = field.validation?.required;
  
  return (
    <Form.Field 
      name={field.id} 
      className={`mb-4 ${field.className || ''}`}
      style={field.style}
    >
      <CheckboxComponent {...props} />
      {isRequired && (
        <Form.Message className={formMessageStyles} match="valueMissing">
          {field.label ? `${field.label} is required` : 'This field is required'}
        </Form.Message>
      )}
    </Form.Field>
  );
};

const CheckboxField: FieldDefinition = {
  component: CheckboxComponent,
  render: renderField,
};

// Register the field type
fieldRegistry.registerField("checkbox", CheckboxField);

export default CheckboxField;
