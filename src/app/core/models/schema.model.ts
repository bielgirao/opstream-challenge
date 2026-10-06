/** Value of one answer, as stored in a draft and sent to the API. */
export type AnswerValue = string | number | boolean | null;

export const FIELD_TYPES = ['text', 'number', 'radio', 'toggle'] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

// ---------------------------------------------------------------------------
// Raw shapes, exactly as the API sends them. Nothing beyond `id`, `label`,
// `type` and `fields` is guaranteed, and `type` may be something we don't support.
// ---------------------------------------------------------------------------

export interface RawSchemaField {
  id: number;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
  default?: AnswerValue;
  /**
   * Extension to the brief's schema (ADR-0013): decimal places allowed in a `number` field.
   * Absent means 0 — numbers are whole by default (both brief schemas only have quantities).
   */
  decimalPlaces?: number;
}

export interface RawSchemaSection {
  id: string;
  title: string;
  fields: RawSchemaField[];
}

export interface RawRequestSchema {
  id: string;
  title: string;
  sections: RawSchemaSection[];
}

// ---------------------------------------------------------------------------
// Normalised shapes used by the app (see normalize-schema.ts).
// ---------------------------------------------------------------------------

export interface SchemaField {
  /** Stringified API id: used as form control key and in URLs. */
  id: string;
  label: string;
  type: FieldType;
  /** Always false for toggles (a switch always has a value). */
  required: boolean;
  /** Radio options; empty for other types. */
  options: readonly string[];
  /** Schema default, or null when the schema has none. */
  defaultValue: AnswerValue;
  /** Decimal places allowed for `number` fields (0 = whole numbers); 0 for other types. */
  decimalPlaces: number;
}

export interface SchemaSection {
  id: string;
  title: string;
  fields: readonly SchemaField[];
}

export interface RequestSchema {
  id: string;
  title: string;
  sections: readonly SchemaSection[];
}
