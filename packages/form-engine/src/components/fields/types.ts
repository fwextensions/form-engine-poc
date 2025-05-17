import { FormField } from "@/services/schemaParser";

export interface FieldComponentProps {
  field: FormField;
  value?: any;
  onChange?: (value: any) => void;
  className?: string;
}
