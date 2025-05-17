import React from "react";
import { Control, Field, Label, Message } from "@radix-ui/react-form";
import { FieldComponent, FieldDefinition } from "./types";
import fieldRegistry from "./FieldRegistry";
import { inputStyles, labelStyles, formMessageStyles } from "./styles";

const DateComponent: FieldComponent = ({ field, value, onChange, className }) => {
  return (
    <Control asChild>
      <input
        type="date"
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
      />
    </Control>
  );
};

const renderField: FieldDefinition['render'] = (props) => {
  const { field } = props;
  
  return (
    <Field name={field.id} className="mb-4 grid">
      <div className="flex items-baseline justify-between">
        <Label className={labelStyles}>
          {field.label}
        </Label>
        <Message className={formMessageStyles} match="valueMissing">
          Please enter a date
        </Message>
        <Message className={formMessageStyles} match="typeMismatch">
          Please enter a valid date
        </Message>
      </div>
      <DateComponent {...props} />
      {field.description && (
        <div className="mt-1 text-sm text-gray-500">
          {field.description}
        </div>
      )}
    </Field>
  );
};

const DateField: FieldDefinition = {
  component: DateComponent,
  render: renderField,
};

// Register the field type
fieldRegistry.registerField("date", DateField);

export default DateField;
