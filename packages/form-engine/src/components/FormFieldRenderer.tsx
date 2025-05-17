"use client";

import React from "react";
import * as Form from "@radix-ui/react-form";
import { FormField } from "@/services/schemaParser";
import fieldRegistry from "./fields/FieldRegistry";
import { FieldComponentProps } from "./fields/types";

interface FormFieldRendererProps {
  field: FormField;
  value?: any;
  onChange?: (value: any) => void;
  className?: string;
}

const FormFieldRenderer: React.FC<FormFieldRendererProps> = ({
  field,
  value,
  onChange,
  className,
}) => {
  const handleChange = (newValue: any) => {
    onChange?.(newValue);
  };

  const fieldDefinition = fieldRegistry.getFieldDefinition(field.type);

  if (!fieldDefinition) {
    console.warn(`No component found for field type: ${field.type}`);
    return null;
  }

  // Pass the field props to the render function
  return fieldDefinition.render({
    field,
    value,
    onChange: handleChange,
    className: field.className ? `${field.className} ${className || ''}` : className,
  });
};

export default FormFieldRenderer;
