import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SectionNav, SectionNavItem } from './section-nav';

const items: SectionNavItem[] = [
  { id: 'requested-item', title: 'Requested Item', active: false, disabled: false, status: 'done' },
  {
    id: 'vendor-info',
    title: 'Vendor Information',
    active: true,
    disabled: false,
    status: 'saving',
  },
  { id: 'approval', title: 'Approval', active: false, disabled: true, status: 'none' },
];

async function render() {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(SectionNav);
  fixture.componentRef.setInput('requestId', 'r1');
  fixture.componentRef.setInput('items', items);
  await fixture.whenStable();
  return [...(fixture.nativeElement as HTMLElement).querySelectorAll('a')];
}

describe('SectionNav', () => {
  it('links every section of the request, in order', async () => {
    const links = await render();
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/requests/r1/sections/requested-item',
      '/requests/r1/sections/vendor-info',
      '/requests/r1/sections/approval',
    ]);
  });

  it('passes active, disabled and status to each item', async () => {
    const [done, current, locked] = await render();
    expect(done.textContent).toContain('(complete)');
    expect(current.getAttribute('aria-current')).toBe('step');
    expect(current.textContent).toContain('(saving)');
    expect(locked.getAttribute('aria-disabled')).toBe('true');
  });

  it('is a labelled navigation landmark', async () => {
    const [first] = await render();
    expect(first.closest('nav')?.getAttribute('aria-label')).toBe('Request sections');
  });
});
