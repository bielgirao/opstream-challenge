import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiChip } from './chip';

@Component({
  imports: [UiChip],
  template: `<button uiChip type="button" [selected]="selected()" (click)="clicks = clicks + 1">Software</button>`,
})
class Host {
  selected = signal(false);
  clicks = 0;
}

describe('UiChip', () => {
  it('exposes selection with aria-pressed', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.getAttribute('aria-pressed')).toBe('false');

    fixture.componentInstance.selected.set(true);
    await fixture.whenStable();
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.classList).toContain('is-selected');
  });

  it('stays a native button', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    expect(fixture.componentInstance.clicks).toBe(1);
    expect(button.textContent).toContain('Software');
  });
});
