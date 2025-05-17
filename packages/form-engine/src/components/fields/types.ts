import { FormField } from "@/services/schemaParser";

export interface FieldComponentProps {
  field: FormField;
  value?: any;
  onChange?: (value: any) => void;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  readOnly?: boolean;
  autoFocus?: boolean;
  tabIndex?: number;
  autoComplete?: string;
  error?: string;
}

export interface FieldDefinition {
  component: React.ComponentType<FieldComponentProps>;
  render: (props: FieldComponentProps) => React.ReactNode;
}

export type FieldComponent = React.FC<FieldComponentProps>;

// Helper type for field registration
export type RegisterFieldFn = (
  type: string,
  definition: FieldDefinition
) => void;
