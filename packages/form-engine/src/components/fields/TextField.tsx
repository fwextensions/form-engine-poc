import React from "react";
import { Control, Field, Label, Message } from "@radix-ui/react-form";
import { FieldComponent, FieldDefinition } from "./types";
import fieldRegistry from "./FieldRegistry";
import { inputStyles, labelStyles, formMessageStyles } from "./styles";

const TextComponent: FieldComponent = ({ field, value, onChange, className }) => {
  return (
    <Control asChild>
      <input
        type={field.type || "text"}
        className={`${inputStyles} ${className || ""}`}
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value)}
        required={field.validation?.required}
        placeholder={field.placeholder}
        disabled={field.disabled}
        readOnly={field.readOnly}
        autoFocus={field.autoFocus}
        tabIndex={field.tabIndex}
        autoComplete={field.autoComplete}
        style={field.style}
      />
    </Control>
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
          {field.label || 'This field'} is required
        </Message>
      </div>
      <TextComponent {...props} />
      {field.description && (
        <div className="mt-1 text-sm text-gray-500">
          {field.description}
        </div>
      )}
    </Field>
  );
};

const TextField: FieldDefinition = {
  component: TextComponent,
  render: renderField,
};

// Register the field type for all text-based input types
const textTypes = ["text", "email", "password", "tel", "url", "number"];
textTypes.forEach(type => {
  fieldRegistry.registerField(type, TextField);
});

export default TextField;
