import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  numericTextPattern,
  parseNumericText,
  sanitizeNumericText,
  UiNumberInput,
} from './number-input';

@Component({
  imports: [ReactiveFormsModule, UiNumberInput],
  template: `<input uiNumberInput [decimalPlaces]="decimalPlaces()" [formControl]="control" />`,
})
class Host {
  decimalPlaces = signal(0);
  control = new FormControl<number | null>(null);
}

function setup(decimalPlaces = 0) {
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.decimalPlaces.set(decimalPlaces);
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
  describe('whole numbers (default)', () => {
    it('is a text field with the numeric keyboard', () => {
      const { input } = setup();
      expect(input.type).toBe('text');
      expect(input.getAttribute('inputmode')).toBe('numeric');
    });

    it('accepts digits, emitting a number', () => {
      const { input, host, type } = setup();
      type('120');
      expect(input.value).toBe('120');
      expect(host.control.value).toBe(120);
    });

    it.each(['a', 'e', 'E', '+', '-', ' ', '%', '.', ','])('blocks typing %j', (char) => {
      const { input, host, insert } = setup();
      insert('4');
      expect(insert(char)).toBe(false);
      expect(input.value).toBe('4');
      expect(host.control.value).toBe(4);
    });

    it('blocks numbers beyond the safe integer range', () => {
      const { input, insert } = setup();
      insert(String(Number.MAX_SAFE_INTEGER), 'insertFromPaste');
      expect(insert('1')).toBe(false);
      expect(input.value).toBe(String(Number.MAX_SAFE_INTEGER));
    });

    it('rejects pasted text that is not a whole number', () => {
      const { input, insert } = setup();
      expect(insert('12abc', 'insertFromPaste')).toBe(false);
      expect(insert('1.5', 'insertFromPaste')).toBe(false);
      expect(input.value).toBe('');
    });

    it('accepts a pasted number surrounded by spaces', () => {
      const { input, host, insert } = setup();
      insert(' 42 ', 'insertFromPaste');
      expect(input.value).toBe('42');
      expect(host.control.value).toBe(42);
    });
  });

  describe('with decimal places', () => {
    it('uses the decimal keyboard and accepts up to the allowed decimals', () => {
      const { input, host, type, insert } = setup(2);
      expect(input.getAttribute('inputmode')).toBe('decimal');
      type('12.5');
      expect(insert('0')).toBe(true);
      expect(insert('1')).toBe(false); // third decimal
      expect(host.control.value).toBe(12.5);
      expect(input.value).toBe('12.50');
    });

    it('blocks a second decimal point', () => {
      const { input, type, insert } = setup(2);
      type('1.5');
      expect(insert('.')).toBe(false);
      expect(input.value).toBe('1.5');
    });

    it('turns a comma into a decimal point', () => {
      const { input, host, type } = setup(2);
      type('3,25');
      expect(input.value).toBe('3.25');
      expect(host.control.value).toBe(3.25);
    });

    it('emits null while only "." is typed', () => {
      const { host, type } = setup(2);
      type('.');
      expect(host.control.value).toBeNull();
    });
  });

  it('sanitises text that bypassed beforeinput (e.g. IME composition)', () => {
    const { input, host } = setup();
    input.value = '1a2.3';
    input.dispatchEvent(new Event('input'));
    expect(input.value).toBe('12');
    expect(host.control.value).toBe(12);
  });

  it('emits null when the field is emptied', () => {
    const { input, host, type } = setup();
    type('5');
    input.value = '';
    input.dispatchEvent(new Event('input'));
    expect(host.control.value).toBeNull();
  });

  it('shows the form value, and nothing for non-numbers', () => {
    const { input, host } = setup();
    host.control.setValue(7);
    expect(input.value).toBe('7');
    host.control.setValue('abc' as unknown as number);
    expect(input.value).toBe('');
  });

  it.each([
    ['007', 0, '7'],
    ['1.', 2, '1'],
    ['.5', 2, '0.5'],
    ['.', 2, ''],
  ])('normalises %j to %j on blur (%i places)', (typed, places, shown) => {
    const { input, host, type } = setup(places as number);
    type(typed as string);
    input.dispatchEvent(new Event('blur'));
    expect(input.value).toBe(shown);
    expect(host.control.value).toBe(shown === '' ? null : Number(shown));
  });

  it('marks the control as touched on blur and follows its disabled state', () => {
    const { input, host } = setup();
    input.dispatchEvent(new Event('blur'));
    expect(host.control.touched).toBe(true);
    host.control.disable();
    expect(input.disabled).toBe(true);
  });
});

describe('numeric text helpers', () => {
  it.each([
    [0, '123', true],
    [0, '1.', false],
    [2, '1.', true],
    [2, '.5', true],
    [2, '1.234', false],
    [2, '1.2.3', false],
  ])('pattern(%i) %s %j', (places, text, expected) => {
    expect(numericTextPattern(places).test(text)).toBe(expected);
  });

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
    ['abc', 0, ''],
    ['-12', 0, '12'],
    ['1e5', 0, '15'],
    ['1.5', 0, '1'],
    ['1,5', 2, '1.5'],
    ['1.2.3', 2, '1.23'],
    ['1.23456', 2, '1.23'],
  ])('sanitises %j (%i places) to %j', (text, places, expected) => {
    expect(sanitizeNumericText(text, places)).toBe(expected);
  });
});
