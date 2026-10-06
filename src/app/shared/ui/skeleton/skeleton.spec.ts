import { TestBed } from '@angular/core/testing';
import { UiSkeleton } from './skeleton';

describe('UiSkeleton', () => {
  it('is hidden from assistive tech and takes its size from inputs', async () => {
    const fixture = TestBed.createComponent(UiSkeleton);
    fixture.componentRef.setInput('width', '120px');
    fixture.componentRef.setInput('height', '32px');
    fixture.componentRef.setInput('radius', 'pill');
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.style.width).toBe('120px');
    expect(el.style.height).toBe('32px');
    expect(el.style.borderRadius).toBe('var(--radius-pill)');
  });

  it('fills the width by default', async () => {
    const fixture = TestBed.createComponent(UiSkeleton);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).style.width).toBe('100%');
  });
});
