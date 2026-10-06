import { RequestSchema } from '../models';
import { RequestForm } from './request-form';

/**
 * Index of the furthest section the user may open: every section before it must be valid
 * (ADR-0007). Equals the index of the first invalid section, or the last section when all are valid.
 */
export function furthestReachableIndex(schema: RequestSchema, form: RequestForm): number {
  const firstInvalid = schema.sections.findIndex((s) => form.controls[s.id]?.invalid);
  return firstInvalid === -1 ? schema.sections.length - 1 : firstInvalid;
}

export function isSectionReachable(
  schema: RequestSchema,
  form: RequestForm,
  sectionId: string,
): boolean {
  const index = schema.sections.findIndex((s) => s.id === sectionId);
  return index !== -1 && index <= furthestReachableIndex(schema, form);
}

/**
 * Where to send the user who asked for `sectionId`: null when it is reachable,
 * otherwise the furthest section they may open.
 */
export function sectionRedirect(
  schema: RequestSchema,
  form: RequestForm,
  sectionId: string | undefined,
): string | null {
  if (sectionId && isSectionReachable(schema, form, sectionId)) return null;
  return schema.sections[furthestReachableIndex(schema, form)].id;
}
