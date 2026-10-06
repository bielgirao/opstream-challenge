import { FieldErrorPipe } from './field-error.pipe';
import { firstErrorMessage } from './validation-messages';

describe('firstErrorMessage', () => {
  it('maps known errors to messages', () => {
    expect(firstErrorMessage({ required: true })).toBe('This field is required');
    expect(firstErrorMessage({ min: { min: 0, actual: -1 } })).toBe('Must be 0 or more');
    expect(firstErrorMessage({ notANumber: true })).toBe('Enter a valid number');
    expect(firstErrorMessage({ invalidOption: {} })).toBe('Choose one of the options');
    expect(firstErrorMessage({ integer: true })).toBe('Enter a whole number');
    expect(firstErrorMessage({ decimalPlaces: { max: 2 } })).toBe('Use at most 2 decimal places');
    expect(firstErrorMessage({ tooLarge: true })).toBe('This number is too large');
  });

  it('falls back for unknown errors and returns null without errors', () => {
    expect(firstErrorMessage({ somethingNew: true })).toBe('Invalid value');
    expect(firstErrorMessage(null)).toBeNull();
    expect(firstErrorMessage({})).toBeNull();
  });
});

describe('FieldErrorPipe', () => {
  const pipe = new FieldErrorPipe();

  it('hides the message until the field should show it', () => {
    expect(pipe.transform({ required: true }, false)).toBeNull();
    expect(pipe.transform({ required: true }, true)).toBe('This field is required');
  });
});
