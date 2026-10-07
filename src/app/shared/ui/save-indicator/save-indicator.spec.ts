import { TestBed } from '@angular/core/testing';
import { SaveIndicatorStatus, UiSaveIndicator } from './save-indicator';

async function render(status: SaveIndicatorStatus) {
  const fixture = TestBed.createComponent(UiSaveIndicator);
  fixture.componentRef.setInput('status', status);
  await fixture.whenStable();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

describe('UiSaveIndicator', () => {
  it.each([
    ['saving', 'Saving…'],
    ['retrying', 'Error – retrying…'],
    ['saved', 'Saved'],
    ['error', "Couldn't save."],
    ['offline', 'Offline – will save when you reconnect'],
  ] as const)('shows the brief\'s label for "%s"', async (status, text) => {
    const { el } = await render(status);
    expect(el.textContent).toContain(text);
  });

  it('renders nothing while idle', async () => {
    const { el } = await render('idle');
    expect(el.textContent?.trim()).toBe('');
  });

  it('is a status live region', async () => {
    const { el } = await render('saving');
    expect(el.getAttribute('role')).toBe('status');
  });

  it('emits retry from the error state', async () => {
    const { fixture, el } = await render('error');
    let retried = false;
    fixture.componentInstance.retry.subscribe(() => (retried = true));
    el.querySelector('button')?.click();
    expect(retried).toBe(true);
  });
});
