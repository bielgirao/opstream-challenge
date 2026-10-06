import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, convertToParamMap, Router, UrlTree } from '@angular/router';
import { MOCK_SCHEMAS } from '../../core/mock-backend/schemas.data';
import { normalizeSchemas } from '../../core/models';
import { ActiveRequest, buildRequestForm, RequestSession } from '../../core/request';
import { sectionAccessGuard, submittedRequestGuard } from './request-access.guards';

const [software] = normalizeSchemas(MOCK_SCHEMAS);

function setup({ active = null as ActiveRequest | null, submitted = false } = {}) {
  TestBed.configureTestingModule({
    providers: [
      {
        provide: RequestSession,
        useValue: { active: signal(active), isSubmitted: () => submitted },
      },
    ],
  });
  const router = TestBed.inject(Router);
  const run = (guard: typeof sectionAccessGuard, params: Record<string, string>) => {
    const route = { paramMap: convertToParamMap(params) } as ActivatedRouteSnapshot;
    const result = TestBed.runInInjectionContext(() => guard(route, {} as never));
    return result instanceof UrlTree ? router.serializeUrl(result) : result;
  };
  return { run };
}

const active = (answers = {}): ActiveRequest => ({
  id: 'r1',
  schema: software,
  form: buildRequestForm(software, answers),
});

describe('sectionAccessGuard', () => {
  it('lets the page load requests that are not open yet', () => {
    const { run } = setup();
    expect(run(sectionAccessGuard, { requestId: 'r1', sectionId: 'vendor-info' })).toBe(true);
  });

  it('sends submitted requests to their summary', () => {
    const { run } = setup({ submitted: true });
    expect(run(sectionAccessGuard, { requestId: 'r1', sectionId: 'requested-item' })).toBe(
      '/requests/r1/summary',
    );
  });

  it('blocks sections after an invalid one', () => {
    const { run } = setup({ active: active() });
    expect(run(sectionAccessGuard, { requestId: 'r1', sectionId: 'vendor-info' })).toBe(
      '/requests/r1/sections/requested-item',
    );
    expect(run(sectionAccessGuard, { requestId: 'r1', sectionId: 'requested-item' })).toBe(true);
  });

  it('allows the next section once the previous ones are valid', () => {
    const { run } = setup({ active: active({ '1758177604': 'Figma', '75484637462': 1 }) });
    expect(run(sectionAccessGuard, { requestId: 'r1', sectionId: 'vendor-info' })).toBe(true);
  });
});

describe('submittedRequestGuard', () => {
  it('only opens the summary of submitted requests', () => {
    expect(setup({ submitted: true }).run(submittedRequestGuard, { requestId: 'r1' })).toBe(true);
    TestBed.resetTestingModule();
    expect(setup().run(submittedRequestGuard, { requestId: 'r1' })).toBe('/requests/r1');
  });
});
