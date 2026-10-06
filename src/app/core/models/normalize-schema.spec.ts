import { normalizeSchema, normalizeSchemas } from './normalize-schema';
import { RawRequestSchema } from './schema.model';

const schema = (sections: RawRequestSchema['sections']): RawRequestSchema => ({
  id: 'test',
  title: 'Test',
  sections,
});

describe('normalizeSchema', () => {
  const warn = vi.fn();
  beforeEach(() => warn.mockReset());

  it('stringifies ids and fills optional properties', () => {
    const result = normalizeSchema(
      schema([
        {
          id: 's1',
          title: 'Section',
          fields: [
            { id: 1758177604, label: 'Item Name', type: 'text', required: true },
            { id: 2389182391823812, label: 'Shipping', type: 'toggle', default: false },
          ],
        },
      ]),
      warn,
    );

    expect(result?.sections[0].fields).toEqual([
      { id: '1758177604', label: 'Item Name', type: 'text', required: true, options: [], defaultValue: null },
      { id: '2389182391823812', label: 'Shipping', type: 'toggle', required: false, options: [], defaultValue: false },
    ]);
    expect(warn).not.toHaveBeenCalled();
  });

  it('treats a missing `required` as optional and never requires toggles', () => {
    const result = normalizeSchema(
      schema([
        {
          id: 's1',
          title: 'S',
          fields: [
            { id: 1, label: 'Quantity', type: 'number' },
            { id: 2, label: 'Toggle', type: 'toggle', required: true },
          ],
        },
      ]),
      warn,
    );
    expect(result?.sections[0].fields.map((f) => f.required)).toEqual([false, false]);
  });

  it('skips unsupported types, radios without options and duplicate ids, with a warning', () => {
    const result = normalizeSchema(
      schema([
        {
          id: 's1',
          title: 'S',
          fields: [
            { id: 1, label: 'Notes', type: 'textarea' },
            { id: 2, label: 'Location', type: 'radio', options: [] },
            { id: 3, label: 'Name', type: 'text' },
            { id: 3, label: 'Name again', type: 'text' },
          ],
        },
      ]),
      warn,
    );
    expect(result?.sections[0].fields.map((f) => f.label)).toEqual(['Name']);
    expect(warn).toHaveBeenCalledTimes(3);
  });

  it('drops sections left without fields, and the schema when no section is left', () => {
    const onlyUnsupported = schema([
      { id: 's1', title: 'S', fields: [{ id: 1, label: 'File', type: 'upload' }] },
    ]);
    expect(normalizeSchema(onlyUnsupported, warn)).toBeNull();
  });

  it('rejects malformed input instead of throwing', () => {
    expect(normalizeSchema({ id: 'x', title: 'X' } as unknown as RawRequestSchema, warn)).toBeNull();
    expect(normalizeSchema(null as unknown as RawRequestSchema, warn)).toBeNull();
  });
});

describe('normalizeSchemas', () => {
  it('keeps only renderable schemas', () => {
    const valid = schema([{ id: 's', title: 'S', fields: [{ id: 1, label: 'A', type: 'text' }] }]);
    const invalid = schema([]);
    expect(normalizeSchemas([valid, invalid], () => {})).toHaveLength(1);
  });
});
