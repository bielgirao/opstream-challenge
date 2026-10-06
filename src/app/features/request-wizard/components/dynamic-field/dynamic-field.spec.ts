import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { validatorsFor } from '../../../../core/forms';
import { AnswerValue, SchemaField } from '../../../../core/models';
import { DynamicField } from './dynamic-field';

const field = (overrides: Partial<SchemaField>): SchemaField => ({
  id: '42',
  label: 'Question',
  type: 'text',
  required: true,
  options: [],
  defaultValue: null,
  decimalPlaces: 0,
  ...overrides,
});

@Component({
  imports: [DynamicField],
  template: `<app-dynamic-field [field]="field()" [control]="control()" />`,
})
class Host {
  field = signal(field({}));
  control = signal(new FormControl<AnswerValue>(''));
}

function render(f: SchemaField, value: AnswerValue = null) {
  const fixture = TestBed.createComponent(Host);
  const control = new FormControl<AnswerValue>(value, validatorsFor(f));
  fixture.componentInstance.field.set(f);
  fixture.componentInstance.control.set(control);
  fixture.detectChanges();
  return { fixture, control, el: fixture.nativeElement as HTMLElement };
}

describe('DynamicField', () => {
  it('renders a labelled text input', () => {
    const { el } = render(field({ type: 'text', label: 'Item Name' }), '');
    expect(el.querySelector('label')?.getAttribute('for')).toBe('field-42');
    expect(el.querySelector('input#field-42')?.getAttribute('type')).toBeNull();
  });

  it('renders numbers with the numeric-only input', () => {
    const { el } = render(field({ type: 'number' }));
    expect(el.querySelector('input#field-42')?.getAttribute('inputmode')).toBe('numeric');
  });

  it('renders radios as a group with one option each', () => {
    const { el } = render(field({ type: 'radio', options: ['USA', 'UK'] }));
    expect(el.querySelector('fieldset legend')?.textContent).toContain('Question');
    expect(el.querySelectorAll('input[type="radio"]')).toHaveLength(2);
  });

  it('renders toggles as a switch, never marked optional', () => {
    const { el } = render(field({ type: 'toggle', required: false }), false);
    expect(el.querySelector('input[role="switch"]')?.id).toBe('field-42');
    expect(el.textContent).not.toContain('(optional)');
  });

  it('marks optional fields', () => {
    const { el } = render(field({ type: 'text', required: false }), '');
    expect(el.textContent).toContain('(optional)');
  });

  it('shows the error only once the field is touched, and links it to the input', async () => {
    const { fixture, control, el } = render(field({ type: 'text' }), '');
    expect(el.querySelector('.ui-field-card__error')).toBeNull();

    control.markAsTouched();
    await fixture.whenStable();

    const input = el.querySelector('input')!;
    expect(el.querySelector('#field-42-error')?.textContent).toContain('This field is required');
    expect(input.getAttribute('aria-describedby')).toBe('field-42-error');
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });
});
