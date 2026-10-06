import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiFieldCard } from './field-card';

@Component({
  imports: [UiFieldCard],
  template: `
    <ui-field-card fieldId="item-name" label="Item Name" [group]="group()" [error]="error()">
      <input id="item-name" />
    </ui-field-card>
  `,
})
class Host {
  group = signal(false);
  error = signal<string | null>(null);
}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  return { fixture, host: fixture.componentInstance, el };
}

describe('UiFieldCard', () => {
  it('labels a single control with <label for>', () => {
    const { el } = setup();
    const label = el.querySelector('label');
    expect(label?.textContent).toContain('Item Name');
    expect(label?.getAttribute('for')).toBe('item-name');
    expect(el.querySelector('input')).not.toBeNull();
  });

  it('uses fieldset + legend for a group of controls', async () => {
    const { fixture, host, el } = setup();
    host.group.set(true);
    await fixture.whenStable();
    expect(el.querySelector('fieldset legend')?.textContent).toContain('Item Name');
    expect(el.querySelector('label')).toBeNull();
    expect(el.querySelector('fieldset input')).not.toBeNull();
  });

  it('renders the error with a predictable id for aria-describedby', async () => {
    const { fixture, host, el } = setup();
    host.error.set('This field is required');
    await fixture.whenStable();
    const error = el.querySelector('#item-name-error');
    expect(error?.textContent).toContain('This field is required');
  });
});
