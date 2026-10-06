import { normalizeSchemas } from '../models';
import { MOCK_SCHEMAS } from '../mock-backend/schemas.data';
import { answersOf, buildRequestForm, coerceAnswer, controlsById } from './request-form';
import { sectionRedirect, isSectionReachable } from './section-access';

const [software, hardware] = normalizeSchemas(MOCK_SCHEMAS);
const ID = {
  softwareItem: '1758177604',
  softwareQty: '75484637462',
  softwareVendor: '4957463729',
  softwareLocation: '8462736152',
  softwareWebsite: '6482937561',
  hardwareShipping: '2389182391823812',
  hardwareLocation: '5587934758234',
};

describe('buildRequestForm', () => {
  it('creates one group per section and one control per field, keyed by id', () => {
    const form = buildRequestForm(software);
    expect(Object.keys(form.controls)).toEqual(['requested-item', 'vendor-info']);
    expect(Object.keys(form.controls['vendor-info'].controls)).toEqual([
      ID.softwareVendor,
      ID.softwareLocation,
      ID.softwareWebsite,
    ]);
  });

  it('starts with empty values per type and the schema defaults', () => {
    expect(answersOf(buildRequestForm(software))).toEqual({
      [ID.softwareItem]: '',
      [ID.softwareQty]: null,
      [ID.softwareVendor]: '',
      [ID.softwareLocation]: null,
      [ID.softwareWebsite]: '',
    });
    expect(answersOf(buildRequestForm(hardware))[ID.hardwareShipping]).toBe(false);
  });

  it('restores saved answers', () => {
    const form = buildRequestForm(software, { [ID.softwareItem]: 'Figma', [ID.softwareQty]: 3 });
    expect(form.controls['requested-item'].getRawValue()).toEqual({
      [ID.softwareItem]: 'Figma',
      [ID.softwareQty]: 3,
    });
    expect(form.controls['requested-item'].valid).toBe(true);
  });

  it('drops saved answers that no longer fit the field', () => {
    const form = buildRequestForm(hardware, {
      [ID.hardwareLocation]: 'Mars', // option no longer exists
      [ID.hardwareShipping]: 'yes', // wrong type
    });
    expect(answersOf(form)[ID.hardwareLocation]).toBeNull();
    expect(answersOf(form)[ID.hardwareShipping]).toBe(false);
  });

  it('applies the schema validation rules', () => {
    const form = buildRequestForm(software);
    const qty = controlsById(form).get(ID.softwareQty)!;
    qty.setValue(2.5);
    expect(qty.errors).toEqual({ integer: true });
    qty.setValue(4);
    expect(qty.valid).toBe(true);
  });
});

describe('coerceAnswer', () => {
  const [number] = software.sections[0].fields.filter((f) => f.type === 'number');
  it('keeps values of the right type and rejects the rest', () => {
    expect(coerceAnswer(number, 3)).toBe(3);
    expect(coerceAnswer(number, null)).toBeNull();
    expect(coerceAnswer(number, '3')).toBeUndefined();
    expect(coerceAnswer(number, NaN)).toBeUndefined();
  });
});

describe('section access', () => {
  it('only the first section is reachable while it is invalid', () => {
    const form = buildRequestForm(software);
    expect(isSectionReachable(software, form, 'requested-item')).toBe(true);
    expect(isSectionReachable(software, form, 'vendor-info')).toBe(false);
    expect(sectionRedirect(software, form, 'vendor-info')).toBe('requested-item');
  });

  it('opens the next section once the previous ones are valid', () => {
    const form = buildRequestForm(software, { [ID.softwareItem]: 'Figma', [ID.softwareQty]: 1 });
    expect(sectionRedirect(software, form, 'vendor-info')).toBeNull();
  });

  it('redirects unknown or missing section ids to the furthest reachable section', () => {
    const form = buildRequestForm(software, { [ID.softwareItem]: 'Figma', [ID.softwareQty]: 1 });
    expect(sectionRedirect(software, form, 'nope')).toBe('vendor-info');
    expect(sectionRedirect(software, form, undefined)).toBe('vendor-info');
  });
});
