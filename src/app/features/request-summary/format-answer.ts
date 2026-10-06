import { AnswerValue, SchemaField } from '../../core/models';

/** Read-only text for an answer, or null when it was not answered. */
export function formatAnswer(field: SchemaField, value: AnswerValue): string | null {
  if (value === null || (typeof value === 'string' && value.trim() === '')) return null;
  if (field.type === 'toggle') return value === true ? 'Yes' : 'No';
  if (typeof value === 'number') {
    return value.toLocaleString('en-US', { maximumFractionDigits: field.decimalPlaces });
  }
  return String(value).trim();
}
