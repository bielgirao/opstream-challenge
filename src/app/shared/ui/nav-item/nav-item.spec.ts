import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NavItemStatus, UiNavItem } from './nav-item';

@Component({
  imports: [UiNavItem],
  template: `
    <a uiNavItem href="#" [active]="active()" [disabled]="disabled()" [status]="status()">Vendor Information</a>
  `,
})
class Host {
  active = signal(false);
  disabled = signal(false);
  status = signal<NavItemStatus>('none');
}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
  return { fixture, host: fixture.componentInstance, link };
}

describe('UiNavItem', () => {
  it('marks the active item as the current step', async () => {
    const { fixture, host, link } = setup();
    expect(link.hasAttribute('aria-current')).toBe(false);
    host.active.set(true);
    await fixture.whenStable();
    expect(link.getAttribute('aria-current')).toBe('step');
  });

  it('takes disabled links out of the tab order', async () => {
    const { fixture, host, link } = setup();
    host.disabled.set(true);
    await fixture.whenStable();
    expect(link.getAttribute('aria-disabled')).toBe('true');
    expect(link.getAttribute('tabindex')).toBe('-1');
  });

  it.each([
    ['saving', 'ui-loader', '(saving)'],
    ['done', 'ui-icon', '(complete)'],
    ['error', 'ui-icon', '(not saved)'],
  ] as const)('shows the %s status with an icon and text for screen readers', async (status, element, text) => {
    const { fixture, host, link } = setup();
    host.status.set(status);
    await fixture.whenStable();
    expect(link.querySelector(element)).not.toBeNull();
    expect(link.querySelector('.visually-hidden')?.textContent).toBe(text);
  });

  it('shows no status by default', () => {
    const { link } = setup();
    expect(link.querySelector('ui-icon, ui-loader')).toBeNull();
  });
});
