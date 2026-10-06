import { FormControl } from '@angular/forms';
import { SchemaField } from '../models';
import { validatorsFor } from './field-validators';

const field = (overrides: Partial<SchemaField>): SchemaField => ({
  id: '1',
  label: 'Field',
  type: 'text',
  required: false,
  options: [],
  defaultValue: null,
  ...overrides,
});

const errorsFor = (f: SchemaField, value: unknown) =>
  new FormControl(value, validatorsFor(f)).errors;

describe('validatorsFor', () => {
  it('text: required means non-blank', () => {
    const f = field({ type: 'text', required: true });
    expect(errorsFor(f, '   ')).toEqual({ required: true });
    expect(errorsFor(f, 'Laptop')).toBeNull();
  });

  it('text: optional accepts empty', () => {
    expect(errorsFor(field({ type: 'text' }), '')).toBeNull();
  });

  it('number: must be finite and >= 0', () => {
    const f = field({ type: 'number', required: true });
    expect(errorsFor(f, null)).toEqual({ required: true });
    expect(errorsFor(f, -5)).toEqual({ min: { min: 0, actual: -5 } });
    expect(errorsFor(f, NaN)).toEqual({ notANumber: true });
    expect(errorsFor(f, 0)).toBeNull();
    expect(errorsFor(f, 2.5)).toBeNull();
  });

  it('number: optional accepts empty', () => {
    expect(errorsFor(field({ type: 'number' }), null)).toBeNull();
  });

  it('radio: value must be one of the options', () => {
    const f = field({ type: 'radio', required: true, options: ['USA', 'UK', 'Other'] });
    expect(errorsFor(f, null)).toEqual({ required: true });
    expect(errorsFor(f, 'Mars')).toEqual({ invalidOption: { options: ['USA', 'UK', 'Other'] } });
    expect(errorsFor(f, 'UK')).toBeNull();
  });

  it('toggle: never has errors', () => {
    const f = field({ type: 'toggle' });
    expect(errorsFor(f, false)).toBeNull();
    expect(errorsFor(f, true)).toBeNull();
  });

  it('does not look at the label', () => {
    const quantity = field({ type: 'number', label: 'Quantity' });
    const other = field({ type: 'number', label: 'Budget' });
    expect(validatorsFor(quantity)).toHaveLength(validatorsFor(other).length);
  });
});
