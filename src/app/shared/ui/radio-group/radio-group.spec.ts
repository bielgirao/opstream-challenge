import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { UiRadioGroup } from './radio-group';

@Component({
  imports: [ReactiveFormsModule, UiRadioGroup],
  template: `<ui-radio-group name="location" [options]="options" [formControl]="control" />`,
})
class Host {
  options = ['USA', 'UK', 'Other'];
  control = new FormControl<string | null>(null);
}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const radios = () =>
    Array.from(fixture.nativeElement.querySelectorAll('input[type="radio"]')) as HTMLInputElement[];
  return { fixture, host: fixture.componentInstance, radios };
}

describe('UiRadioGroup', () => {
  it('renders one native radio per option, sharing the same name', () => {
    const { radios } = setup();
    expect(radios().map((r) => r.value)).toEqual(['USA', 'UK', 'Other']);
    expect(new Set(radios().map((r) => r.name))).toEqual(new Set(['location']));
  });

  it('reflects the form value (writeValue)', async () => {
    const { fixture, host, radios } = setup();
    host.control.setValue('UK');
    await fixture.whenStable();
    expect(radios().find((r) => r.checked)?.value).toBe('UK');
  });

  it('updates the form when the user picks an option', () => {
    const { host, radios } = setup();
    radios()[2].click();
    expect(host.control.value).toBe('Other');
  });

  it('marks the control as touched on blur', () => {
    const { host, radios } = setup();
    radios()[0].dispatchEvent(new Event('blur'));
    expect(host.control.touched).toBe(true);
  });

  it('disables every radio when the control is disabled', async () => {
    const { fixture, host, radios } = setup();
    host.control.disable();
    await fixture.whenStable();
    expect(radios().every((r) => r.disabled)).toBe(true);
  });

  it('ignores values that are not strings', async () => {
    const { fixture, host, radios } = setup();
    host.control.setValue(42 as unknown as string);
    await fixture.whenStable();
    expect(radios().some((r) => r.checked)).toBe(false);
  });
});
