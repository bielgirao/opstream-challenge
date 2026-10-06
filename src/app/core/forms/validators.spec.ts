import { FormControl } from '@angular/forms';
import { finiteNumber, oneOf, requiredTrimmed } from './validators';

const errorsOf = (validator: typeof requiredTrimmed, value: unknown) =>
  validator(new FormControl(value));

describe('requiredTrimmed', () => {
  it.each([null, undefined, '', '   ', '\n\t'])('flags %j as required', (value) => {
    expect(errorsOf(requiredTrimmed, value)).toEqual({ required: true });
  });

  it.each(['a', ' a ', 0, false, true])('accepts %j', (value) => {
    expect(errorsOf(requiredTrimmed, value)).toBeNull();
  });
});

describe('finiteNumber', () => {
  it.each([0, -1, 3.5, 1e6])('accepts %j', (value) => {
    expect(errorsOf(finiteNumber, value)).toBeNull();
  });

  it.each([NaN, Infinity, -Infinity, '12'])('rejects %j', (value) => {
    expect(errorsOf(finiteNumber, value)).toEqual({ notANumber: true });
  });

  it('leaves empty values to `required`', () => {
    expect(errorsOf(finiteNumber, null)).toBeNull();
  });
});

describe('oneOf', () => {
  const validator = oneOf(['USA', 'UK']);

  it('accepts a listed option and empty values', () => {
    expect(errorsOf(validator, 'UK')).toBeNull();
    expect(errorsOf(validator, null)).toBeNull();
  });

  it('rejects values outside the options (e.g. a stale draft)', () => {
    expect(errorsOf(validator, 'Brazil')).toEqual({ invalidOption: { options: ['USA', 'UK'] } });
  });
});
