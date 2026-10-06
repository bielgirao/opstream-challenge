import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const isEmpty = (value: unknown): boolean =>
  value === null || value === undefined || (typeof value === 'string' && value.trim() === '');

/**
 * Like Validators.required, but whitespace-only text counts as empty.
 * Works for every answer type: '', '   ', null and undefined are all "no answer".
 */
export const requiredTrimmed: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  isEmpty(control.value) ? { required: true } : null;

/**
 * Rejects NaN and ±Infinity. Empty values pass: emptiness is `required`'s job.
 *
 * Note: <input type="number"> reports unparsable text (e.g. "1e") as an empty value,
 * so that case reaches this validator as null.
 */
export const finiteNumber: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const { value } = control;
  if (isEmpty(value)) return null;
  return typeof value === 'number' && Number.isFinite(value) ? null : { notANumber: true };
};

/** The value must be one of `options`. Empty values pass. */
export const oneOf =
  (options: readonly string[]): ValidatorFn =>
  (control: AbstractControl): ValidationErrors | null => {
    const { value } = control;
    if (isEmpty(value)) return null;
    return options.includes(value) ? null : { invalidOption: { options } };
  };
