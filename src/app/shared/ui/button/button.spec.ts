import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiButton } from './button';

@Component({
  imports: [UiButton],
  template: `<button uiButton type="button" [loading]="loading()" [disabled]="disabled()">
    Submit
  </button>`,
})
class Host {
  loading = signal(false);
  disabled = signal(false);
}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  return { fixture, host: fixture.componentInstance, button };
}

describe('UiButton', () => {
  it('is enabled and not busy by default', () => {
    const { button } = setup();
    expect(button.disabled).toBe(false);
    expect(button.hasAttribute('aria-busy')).toBe(false);
  });

  it('is disabled, busy and shows a spinner while loading', async () => {
    const { fixture, host, button } = setup();
    host.loading.set(true);
    await fixture.whenStable();
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.querySelector('ui-loader')).not.toBeNull();
  });

  it('can be disabled explicitly', async () => {
    const { fixture, host, button } = setup();
    host.disabled.set(true);
    await fixture.whenStable();
    expect(button.disabled).toBe(true);
  });
});
