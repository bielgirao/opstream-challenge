import {
  FIELD_TYPES,
  FieldType,
  RawRequestSchema,
  RawSchemaField,
  RequestSchema,
  SchemaField,
  SchemaSection,
} from './schema.model';

type Warn = (message: string) => void;

const isFieldType = (type: unknown): type is FieldType =>
  FIELD_TYPES.includes(type as FieldType);

/** Upper bound for `decimalPlaces`; beyond this, floating point makes the rule meaningless. */
export const MAX_DECIMAL_PLACES = 6;

/**
 * Turns an API schema into the shape the app relies on, dropping what cannot be rendered
 * instead of failing: unsupported field types, radios without options, duplicate field ids,
 * and sections left empty. Each drop is reported through `warn`.
 *
 * Returns null when nothing renderable is left.
 */
export function normalizeSchema(
  raw: RawRequestSchema,
  warn: Warn = console.warn,
): RequestSchema | null {
  if (!raw || typeof raw.id !== 'string' || !Array.isArray(raw.sections)) {
    warn('Skipping malformed schema');
    return null;
  }

  const seenFieldIds = new Set<string>();
  const sections: SchemaSection[] = [];

  for (const rawSection of raw.sections) {
    const rawFields = Array.isArray(rawSection?.fields) ? rawSection.fields : [];
    const fields: SchemaField[] = [];

    for (const rawField of rawFields) {
      const field = normalizeField(rawField, raw.id, warn);
      if (!field) continue;
      if (seenFieldIds.has(field.id)) {
        warn(`[${raw.id}] Skipping field ${field.id}: duplicate id`);
        continue;
      }
      seenFieldIds.add(field.id);
      fields.push(field);
    }

    if (fields.length === 0) {
      warn(`[${raw.id}] Skipping section "${rawSection?.id}": no renderable fields`);
      continue;
    }
    sections.push({ id: rawSection.id, title: rawSection.title, fields });
  }

  if (sections.length === 0) {
    warn(`[${raw.id}] Skipping schema: no renderable sections`);
    return null;
  }
  return { id: raw.id, title: raw.title, sections };
}

export function normalizeSchemas(
  raws: readonly RawRequestSchema[],
  warn: Warn = console.warn,
): RequestSchema[] {
  return raws.flatMap((raw) => normalizeSchema(raw, warn) ?? []);
}

function normalizeField(raw: RawSchemaField, schemaId: string, warn: Warn): SchemaField | null {
  if (!isFieldType(raw?.type)) {
    warn(`[${schemaId}] Skipping field ${raw?.id} ("${raw?.label}"): unsupported type "${raw?.type}"`);
    return null;
  }

  const options = raw.type === 'radio' ? (raw.options ?? []).filter((o) => typeof o === 'string') : [];
  if (raw.type === 'radio' && options.length === 0) {
    warn(`[${schemaId}] Skipping radio field ${raw.id} ("${raw.label}"): no options`);
    return null;
  }

  return {
    id: String(raw.id),
    label: raw.label,
    type: raw.type,
    required: raw.type !== 'toggle' && raw.required === true,
    options,
    defaultValue: raw.default ?? null,
    decimalPlaces: raw.type === 'number' ? normalizeDecimalPlaces(raw, schemaId, warn) : 0,
  };
}

function normalizeDecimalPlaces(raw: RawSchemaField, schemaId: string, warn: Warn): number {
  const { decimalPlaces } = raw;
  if (decimalPlaces === undefined) return 0;
  if (Number.isInteger(decimalPlaces) && decimalPlaces >= 0 && decimalPlaces <= MAX_DECIMAL_PLACES) {
    return decimalPlaces;
  }
  warn(`[${schemaId}] Field ${raw.id}: invalid decimalPlaces ${JSON.stringify(decimalPlaces)}, using 0`);
  return 0;
}
