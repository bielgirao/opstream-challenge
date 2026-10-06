import { TestBed } from '@angular/core/testing';
import { UiLoader } from './loader';

async function render(inputs: { label?: string; size?: 'sm' | 'md' | 'lg' } = {}) {
  const fixture = TestBed.createComponent(UiLoader);
  for (const [key, value] of Object.entries(inputs)) fixture.componentRef.setInput(key, value);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('UiLoader', () => {
  it('is decorative without a label', async () => {
    const el = await render();
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.getAttribute('role')).toBeNull();
  });

  it('announces itself as a status when labelled', async () => {
    const el = await render({ label: 'Loading…' });
    expect(el.getAttribute('role')).toBe('status');
    expect(el.getAttribute('aria-hidden')).toBeNull();
    expect(el.textContent).toContain('Loading…');
  });

  it('applies the size modifier', async () => {
    expect((await render()).classList).toContain('ui-loader--md');
    expect((await render({ size: 'lg' })).classList).toContain('ui-loader--lg');
  });
});
