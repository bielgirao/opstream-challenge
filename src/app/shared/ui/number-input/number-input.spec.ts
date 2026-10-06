import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { parseNumericText, sanitizeNumericText, UiNumberInput } from './number-input';

@Component({
  imports: [ReactiveFormsModule, UiNumberInput],
  template: `<input uiNumberInput [formControl]="control" />`,
})
class Host {
  control = new FormControl<number | null>(null);
}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
  const host = fixture.componentInstance;

  /** Simulates the browser: fire beforeinput, apply the insertion unless prevented, fire input. */
  const insert = (data: string, inputType = 'insertText') => {
    const event = new InputEvent('beforeinput', { data, inputType, cancelable: true });
    input.dispatchEvent(event);
    if (!event.defaultPrevented) {
      input.setRangeText(data, input.selectionStart ?? 0, input.selectionEnd ?? 0, 'end');
      input.dispatchEvent(new Event('input'));
    }
    return !event.defaultPrevented;
  };
  const type = (text: string) => [...text].forEach((char) => insert(char));

  return { input, host, insert, type };
}

describe('UiNumberInput', () => {
  it('is a text field with a numeric keyboard', () => {
    const { input } = setup();
    expect(input.type).toBe('text');
    expect(input.getAttribute('inputmode')).toBe('decimal');
  });

  it('accepts digits and one decimal point, emitting a number', () => {
    const { input, host, type } = setup();
    type('12.5');
    expect(input.value).toBe('12.5');
    expect(host.control.value).toBe(12.5);
  });

  it.each(['a', 'e', 'E', '+', '-', ' ', '%'])('blocks typing %j', (char) => {
    const { input, host, insert } = setup();
    insert('4');
    expect(insert(char)).toBe(false);
    expect(input.value).toBe('4');
    expect(host.control.value).toBe(4);
  });

  it('blocks a second decimal point', () => {
    const { input, type, insert } = setup();
    type('1.5');
    expect(insert('.')).toBe(false);
    expect(input.value).toBe('1.5');
  });

  it('turns a comma into a decimal point', () => {
    const { input, host, type } = setup();
    type('3,25');
    expect(input.value).toBe('3.25');
    expect(host.control.value).toBe(3.25);
  });

  it('rejects pasted text containing anything but a number', () => {
    const { input, insert } = setup();
    expect(insert('12abc', 'insertFromPaste')).toBe(false);
    expect(input.value).toBe('');
  });

  it('accepts a pasted number surrounded by spaces', () => {
    const { input, host, insert } = setup();
    insert(' 42 ', 'insertFromPaste');
    expect(input.value).toBe('42');
    expect(host.control.value).toBe(42);
  });

  it('emits null when the field is emptied or holds only "."', () => {
    const { input, host, type } = setup();
    type('.');
    expect(host.control.value).toBeNull();
    input.value = '';
    input.dispatchEvent(new Event('input'));
    expect(host.control.value).toBeNull();
  });

  it('sanitises text that bypassed beforeinput (e.g. IME composition)', () => {
    const { input, host } = setup();
    input.value = '1a2.3.4';
    input.dispatchEvent(new Event('input'));
    expect(input.value).toBe('12.34');
    expect(host.control.value).toBe(12.34);
  });

  it('shows the form value, and nothing for non-numbers', () => {
    const { input, host } = setup();
    host.control.setValue(7);
    expect(input.value).toBe('7');
    host.control.setValue('abc' as unknown as number);
    expect(input.value).toBe('');
  });

  it('marks the control as touched on blur and follows its disabled state', () => {
    const { input, host } = setup();
    input.dispatchEvent(new Event('blur'));
    expect(host.control.touched).toBe(true);
    host.control.disable();
    expect(input.disabled).toBe(true);
  });
});

describe('parseNumericText / sanitizeNumericText', () => {
  it.each([
    ['', null],
    ['.', null],
    ['0', 0],
    ['007', 7],
    ['1.', 1],
    ['.5', 0.5],
  ])('parses %j as %j', (text, expected) => {
    expect(parseNumericText(text)).toBe(expected);
  });

  it.each([
    ['abc', ''],
    ['-12', '12'],
    ['1e5', '15'],
    ['1,5', '1.5'],
    ['1.2.3', '1.23'],
  ])('sanitises %j to %j', (text, expected) => {
    expect(sanitizeNumericText(text)).toBe(expected);
  });
});
