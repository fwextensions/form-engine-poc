import React from "react";
import * as Form from "@radix-ui/react-form";
import { FieldComponent, FieldDefinition } from "./types";
import fieldRegistry from "./FieldRegistry";
import { inputStyles, labelStyles, formMessageStyles } from "./styles";

const TextareaComponent: FieldComponent = ({ field, value, onChange, className }) => {
  return (
    <Form.Control asChild>
      <textarea
        className={`${inputStyles} min-h-[80px] ${className || ""}`}
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value)}
        required={field.validation?.required}
        placeholder={field.placeholder}
        rows={field.rows || 3}
        disabled={field.disabled}
        readOnly={field.readOnly}
        autoFocus={field.autoFocus}
        tabIndex={field.tabIndex}
        autoComplete={field.autoComplete}
        style={field.style}
      />
    </Form.Control>
  );
};

const renderField: FieldDefinition['render'] = (props) => {
  const { field } = props;
  
  return (
    <Form.Field 
      name={field.id} 
      className={`mb-4 grid ${field.className || ''}`}
      style={field.style}
    >
      <div className="flex items-baseline justify-between">
        {field.label && (
          <Form.Label className={labelStyles}>
            {field.label}
          </Form.Label>
        )}
        <Form.Message className={formMessageStyles} match="valueMissing">
          {field.label || 'This field'} is required
        </Form.Message>
      </div>
      <TextareaComponent {...props} />
      {field.description && (
        <div className="mt-1 text-sm text-gray-500">
          {field.description}
        </div>
      )}
    </Form.Field>
  );
};

const TextareaField: FieldDefinition = {
  component: TextareaComponent,
  render: renderField,
};

// Register the field type
fieldRegistry.registerField("textarea", TextareaField);

export default TextareaField;
