import { ValidationErrors } from '@angular/forms';

type MessageFn = (error: unknown) => string;

/** User-facing message per validation error key. */
export const VALIDATION_MESSAGES: Readonly<Record<string, MessageFn>> = {
  required: () => 'This field is required',
  notANumber: () => 'Enter a valid number',
  min: (error) => `Must be ${(error as { min: number }).min} or more`,
  invalidOption: () => 'Choose one of the options',
  integer: () => 'Enter a whole number',
  decimalPlaces: (error) => `Use at most ${(error as { max: number }).max} decimal places`,
  tooLarge: () => 'This number is too large',
};

const FALLBACK_MESSAGE = 'Invalid value';

/** Message for the first error of a control, or null when it has none. */
export function firstErrorMessage(errors: ValidationErrors | null | undefined): string | null {
  const first = errors ? Object.entries(errors)[0] : undefined;
  if (!first) return null;
  const [key, error] = first;
  return VALIDATION_MESSAGES[key]?.(error) ?? FALLBACK_MESSAGE;
}
