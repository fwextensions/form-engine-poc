import { ComponentType } from "react";
import { FormField } from "@/services/schemaParser";
import { FieldComponentProps } from "./types";

type FieldRegistry = {
  [key: string]: ComponentType<FieldComponentProps>;
};

const fieldRegistry: FieldRegistry = {};

export const registerField = (type: string, component: ComponentType<FieldComponentProps>) => {
  fieldRegistry[type] = component;
};

export const getFieldComponent = (type: string) => {
  return fieldRegistry[type] || null;
};

// Export the registry for initialization
export default fieldRegistry;
