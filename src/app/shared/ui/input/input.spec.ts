import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { UiInput } from './input';

@Component({
  imports: [ReactiveFormsModule, UiInput],
  template: `<input uiInput [formControl]="control" [invalid]="invalid()" />`,
})
class Host {
  invalid = signal(false);
  control = new FormControl('');
}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  return {
    fixture,
    host: fixture.componentInstance,
    input: fixture.nativeElement.querySelector('input') as HTMLInputElement,
  };
}

describe('UiInput', () => {
  it('keeps the native value accessor working', () => {
    const { host, input } = setup();
    input.value = 'Figma';
    input.dispatchEvent(new Event('input'));
    expect(host.control.value).toBe('Figma');
  });

  it('sets aria-invalid only while invalid', async () => {
    const { fixture, host, input } = setup();
    expect(input.hasAttribute('aria-invalid')).toBe(false);
    host.invalid.set(true);
    await fixture.whenStable();
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });
});
