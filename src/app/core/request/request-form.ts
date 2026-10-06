import { FormControl, FormGroup } from '@angular/forms';
import { validatorsFor } from '../forms';
import { AnswerValue, FieldType, RequestSchema, SchemaField } from '../models';

export type AnswerControl = FormControl<AnswerValue>;
/** One section: field id → control. */
export type SectionGroup = FormGroup<Record<string, AnswerControl>>;
/** The whole request: section id → section group (ADR-0005). */
export type RequestForm = FormGroup<Record<string, SectionGroup>>;

export type Answers = Readonly<Record<string, AnswerValue>>;

/**
 * Builds the form for a schema, optionally restoring saved answers.
 * Initial value per field: a valid saved answer → the schema default → the type's empty value.
 */
export function buildRequestForm(schema: RequestSchema, answers: Answers = {}): RequestForm {
  const sections: Record<string, SectionGroup> = {};
  for (const section of schema.sections) {
    const controls: Record<string, AnswerControl> = {};
    for (const field of section.fields) {
      controls[field.id] = new FormControl<AnswerValue>(initialValue(field, answers), {
        validators: validatorsFor(field),
      });
    }
    sections[section.id] = new FormGroup(controls);
  }
  return new FormGroup(sections);
}

export function initialValue(field: SchemaField, answers: Answers): AnswerValue {
  if (Object.hasOwn(answers, field.id)) {
    const restored = coerceAnswer(field, answers[field.id]);
    if (restored !== undefined) return restored;
  }
  return coerceAnswer(field, field.defaultValue) ?? emptyValue(field.type);
}

export function emptyValue(type: FieldType): AnswerValue {
  switch (type) {
    case 'text':
      return '';
    case 'toggle':
      return false;
    case 'number':
    case 'radio':
      return null;
  }
}

/**
 * Returns the value if it fits the field, or undefined when it doesn't — e.g. a saved radio
 * answer whose option was removed from the schema, or a string saved for a number field.
 */
export function coerceAnswer(field: SchemaField, value: unknown): AnswerValue | undefined {
  switch (field.type) {
    case 'text':
      return typeof value === 'string' ? value : undefined;
    case 'number':
      return value === null || (typeof value === 'number' && Number.isFinite(value))
        ? value
        : undefined;
    case 'radio':
      return value === null || (typeof value === 'string' && field.options.includes(value))
        ? value
        : undefined;
    case 'toggle':
      return typeof value === 'boolean' ? value : undefined;
  }
}

/** Flattens the form into field id → value. */
export function answersOf(form: RequestForm): Record<string, AnswerValue> {
  return Object.assign({}, ...Object.values(form.getRawValue()));
}

/** Every field control, keyed by field id. */
export function controlsById(form: RequestForm): Map<string, AnswerControl> {
  const controls = new Map<string, AnswerControl>();
  for (const section of Object.values(form.controls)) {
    for (const [fieldId, control] of Object.entries(section.controls)) {
      controls.set(fieldId, control);
    }
  }
  return controls;
}
