import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { UiToggleSwitch } from './toggle-switch';

@Component({
  imports: [ReactiveFormsModule, UiToggleSwitch],
  template: `<ui-toggle-switch inputId="shipping" [formControl]="control"
    >Requires shipping</ui-toggle-switch
  >`,
})
class Host {
  control = new FormControl(false);
}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
  return { fixture, host: fixture.componentInstance, input };
}

describe('UiToggleSwitch', () => {
  it('is a native checkbox exposed as a switch, with the given id', () => {
    const { input } = setup();
    expect(input.type).toBe('checkbox');
    expect(input.getAttribute('role')).toBe('switch');
    expect(input.id).toBe('shipping');
  });

  it('reflects the form value (writeValue)', async () => {
    const { fixture, host, input } = setup();
    host.control.setValue(true);
    await fixture.whenStable();
    expect(input.checked).toBe(true);
  });

  it('updates the form when toggled', () => {
    const { host, input } = setup();
    input.click();
    expect(host.control.value).toBe(true);
    input.click();
    expect(host.control.value).toBe(false);
  });

  it('treats anything other than `true` as off', async () => {
    const { fixture, host, input } = setup();
    host.control.setValue('yes' as unknown as boolean);
    await fixture.whenStable();
    expect(input.checked).toBe(false);
  });

  it('disables the switch when the control is disabled', async () => {
    const { fixture, host, input } = setup();
    host.control.disable();
    await fixture.whenStable();
    expect(input.disabled).toBe(true);
  });
});
