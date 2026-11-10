export type FieldType =
  | "text"
  | "email"
  | "tel"
  | "number"
  | "select"
  | "textarea"
  | "checkbox";

export interface FieldOption {
  label: string;
  value: string;
}

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  helper?: string;
  required?: boolean;
  defaultValue?: string;
  options?: FieldOption[];
  /**
   * For a select: the options come from the verified merchants of this kind
   * (value = merchant id, label = name). Any static `options` are added after them,
   * e.g. "My school is not listed".
   */
  optionsSource?: { type: "merchants"; kind: string };
  min?: number;
  max?: number;
  colSpan?: 1 | 2;
  /** Only show this field when another field equals a value */
  showIf?: { field: string; equals: string };
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
}

/** Normalized calculator shape used by the UI (see src/lib/api/programs.ts) */
export interface CalculatorConfig {
  weeklyRatePct: number;
  minWeeks: number;
  maxWeeks: number;
  defaultWeeks: number;
  minAmount: number;
  maxAmount: number;
  defaultAmount: number;
  amountField: string;
  weeksField: string;
}

export interface Program {
  id?: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  status: "live" | "coming-soon";
  icon: string;
  highlights: string[];
  terms: { label: string; value: string }[];
  steps: { title: string; description: string }[];
  calculator?: CalculatorConfig;
  sections: FormSection[];
}