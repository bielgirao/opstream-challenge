import { TestBed } from '@angular/core/testing';
import { UiIcon } from './icon';

async function render(name: 'check' | 'check-circle' | 'apps', size?: number) {
  const fixture = TestBed.createComponent(UiIcon);
  fixture.componentRef.setInput('name', name);
  if (size) fixture.componentRef.setInput('size', size);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('UiIcon', () => {
  it('is decorative', async () => {
    const el = await render('check');
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.querySelector('svg')?.getAttribute('focusable')).toBe('false');
  });

  it('draws the shapes of the requested icon', async () => {
    expect((await render('check')).querySelectorAll('path')).toHaveLength(1);
    const checkCircle = await render('check-circle');
    expect(checkCircle.querySelectorAll('circle')).toHaveLength(1);
    expect(checkCircle.querySelectorAll('path')).toHaveLength(1);
    expect((await render('apps')).querySelectorAll('rect')).toHaveLength(4);
  });

  it('sizes itself through a CSS variable (16px by default)', async () => {
    expect((await render('check')).style.getPropertyValue('--icon-size')).toBe('16px');
    expect((await render('check', 48)).style.getPropertyValue('--icon-size')).toBe('48px');
  });
});
