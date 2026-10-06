import { SchemaField } from '../../core/models';
import { formatAnswer } from './format-answer';

const field = (overrides: Partial<SchemaField>): SchemaField => ({
  id: '1',
  label: 'Field',
  type: 'text',
  required: false,
  options: [],
  defaultValue: null,
  decimalPlaces: 0,
  ...overrides,
});

describe('formatAnswer', () => {
  it('treats empty answers as not answered', () => {
    expect(formatAnswer(field({}), '')).toBeNull();
    expect(formatAnswer(field({}), '   ')).toBeNull();
    expect(formatAnswer(field({ type: 'number' }), null)).toBeNull();
  });

  it('shows toggles as Yes / No', () => {
    expect(formatAnswer(field({ type: 'toggle' }), true)).toBe('Yes');
    expect(formatAnswer(field({ type: 'toggle' }), false)).toBe('No');
  });

  it('formats numbers with thousands separators', () => {
    expect(formatAnswer(field({ type: 'number' }), 1500)).toBe('1,500');
    expect(formatAnswer(field({ type: 'number', decimalPlaces: 2 }), 19.9)).toBe('19.9');
  });

  it('trims text', () => {
    expect(formatAnswer(field({}), '  Figma ')).toBe('Figma');
  });
});
