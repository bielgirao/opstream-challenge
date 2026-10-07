import { TestBed } from '@angular/core/testing';
import { UiPlaygroundPage } from './ui-playground.page';

describe('UiPlaygroundPage', () => {
  it('renders every component section', async () => {
    const fixture = TestBed.createComponent(UiPlaygroundPage);
    await fixture.whenStable();
    const headings = [...(fixture.nativeElement as HTMLElement).querySelectorAll('h2')].map(
      (h) => h.textContent,
    );
    expect(headings).toEqual([
      'Button',
      'Chip',
      'Form fields (Reactive Forms)',
      'Field error states',
      'Toggle switch',
      'Navigation item',
      'Save indicator',
      'Notification',
      'Loading',
      'Card',
    ]);
  });
});
