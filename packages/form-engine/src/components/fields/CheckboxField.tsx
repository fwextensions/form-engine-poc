import React from "react";
import * as Form from "@radix-ui/react-form";
import { FieldComponent, FieldDefinition } from "./types";
import fieldRegistry from "./FieldRegistry";
import { formMessageStyles, labelStyles } from "./styles";

const CheckboxComponent: FieldComponent = ({ field, value, onChange, className }) => {
  const handleChange = () => {
    if (!field.disabled && !field.readOnly) {
      onChange?.(!value);
    }
  };

  const isChecked = !!value;
  const isDisabled = field.disabled || field.readOnly;
  
  return (
    <div className="flex items-start gap-3">
      <Form.Control asChild>
        <button
          type="button"
          role="checkbox"
          aria-checked={isChecked}
          disabled={isDisabled}
          className={`
            flex-shrink-0 w-5 h-5 rounded flex items-center justify-center 
            transition-colors duration-200
            ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}
            ${isChecked 
              ? 'bg-blue-600 border-blue-600' 
              : 'border border-gray-300 bg-white hover:border-blue-500'
            }
            ${isDisabled && !isChecked ? 'bg-gray-100' : ''}
            ${className || ''}
          `}
          onClick={handleChange}
          style={field.style}
        >
          {isChecked && (
            <svg 
              width="12" 
              height="12" 
              viewBox="0 0 15 15" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className={isDisabled ? 'opacity-70' : ''}
            >
              <path 
                d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3377 6.96028 11.3417C6.78499 11.3457 6.61914 11.2606 6.51285 11.1123L3.51285 7.01227C3.36005 6.79497 3.40745 6.49283 3.62475 6.34003C3.84205 6.18723 4.14419 6.23463 4.29699 6.45193L6.85751 10.1005L10.6018 3.90723C10.7907 3.61833 11.178 3.53725 11.4669 3.72684Z" 
                fill="currentColor" 
                fillRule="evenodd" 
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>
      </Form.Control>
      
      <div className="flex-1">
        {field.label && (
          <Form.Label 
            className={`block text-sm font-medium ${
              isDisabled ? 'text-gray-400' : 'text-gray-700 cursor-pointer'
            }`}
            onClick={!isDisabled ? handleChange : undefined}
          >
            {field.label}
          </Form.Label>
        )}
        {field.description && !isChecked && (
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
      {field.description && props.value && (
        <div className="mt-1 text-sm text-gray-500">
          {field.description}
        </div>
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
