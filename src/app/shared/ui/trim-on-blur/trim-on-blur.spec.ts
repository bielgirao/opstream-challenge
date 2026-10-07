import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { UiTrimOnBlur } from './trim-on-blur';

@Component({
  imports: [ReactiveFormsModule, UiTrimOnBlur],
  template: `<input uiTrimOnBlur [formControl]="control" />`,
})
class Host {
  control = new FormControl<string | null>('');
}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
  return { control: fixture.componentInstance.control, input };
}

describe('UiTrimOnBlur', () => {
  it('trims the value when the field loses focus', () => {
    const { control, input } = setup();
    input.value = '  Figma  ';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    expect(control.value).toBe('Figma');
    expect(input.value).toBe('Figma');
  });

  it('does not touch the value while typing', () => {
    const { control, input } = setup();
    input.value = 'Figma ';
    input.dispatchEvent(new Event('input'));
    expect(control.value).toBe('Figma ');
  });

  it('only emits a change when something was trimmed', () => {
    const { control, input } = setup();
    control.setValue('Figma');
    const changes: unknown[] = [];
    control.valueChanges.subscribe((v) => changes.push(v));
    input.dispatchEvent(new Event('blur'));
    expect(changes).toEqual([]);
  });

  it('ignores non-string values', () => {
    const { control, input } = setup();
    control.setValue(null);
    input.dispatchEvent(new Event('blur'));
    expect(control.value).toBeNull();
  });
});
