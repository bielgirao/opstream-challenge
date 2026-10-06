import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { firstValueFrom } from 'rxjs';
import { RequestSession } from '../../core/request';
import {
  clickButton,
  provideRequestFlowTesting,
  SOFTWARE,
  SOFTWARE_SCHEMA,
} from '../../../testing/request-flow-testing';
import { RequestSummaryPage } from './request-summary.page';

async function submittedRequest() {
  const { providers } = provideRequestFlowTesting();
  TestBed.configureTestingModule({ providers });
  const session = TestBed.inject(RequestSession);
  const { id, form } = session.start(SOFTWARE_SCHEMA);
  form.patchValue({
    'requested-item': { [SOFTWARE.itemName]: 'Figma', [SOFTWARE.quantity]: 1500 },
    'vendor-info': { [SOFTWARE.vendorName]: 'Figma Inc.', [SOFTWARE.vendorLocation]: 'UK' },
  });
  expect(await firstValueFrom(session.submit())).toBe('submitted');

  const harness = await RouterTestingHarness.create();
  await harness.navigateByUrl(`/requests/${id}/summary`, RequestSummaryPage);
  await harness.fixture.whenStable();
  return { harness, session, id, el: harness.routeNativeElement as HTMLElement };
}

describe('RequestSummaryPage', () => {
  it('lists every answer by section, marking empty ones as not answered', async () => {
    const { el } = await submittedRequest();
    const rows = [...el.querySelectorAll('.summary__row')].map((row) => [
      row.querySelector('dt')?.textContent?.trim(),
      row.querySelector('dd')?.textContent?.trim(),
    ]);
    expect(rows).toEqual([
      ['Item Name', 'Figma'],
      ['Quantity', '1,500'],
      ['Vendor Name', 'Figma Inc.'],
      ['Vendor Location', 'UK'],
      ['Website', 'not answered'],
    ]);
    expect(el.querySelector('dd.is-empty')?.textContent?.trim()).toBe('not answered');
  });

  it('has a single action that starts over from the chooser', async () => {
    const { harness, session, el } = await submittedRequest();
    expect(el.querySelectorAll('button')).toHaveLength(1);

    clickButton(el, 'Create New Request');
    await harness.fixture.whenStable();
    expect(session.active()).toBeNull();
    expect(TestBed.inject(Router).url).toBe('/requests/new');
  });

  it('is only reachable once the request is submitted', async () => {
    const { providers } = provideRequestFlowTesting();
    TestBed.configureTestingModule({ providers });
    const { id } = TestBed.inject(RequestSession).start(SOFTWARE_SCHEMA);
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(`/requests/${id}/summary`);
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe(`/requests/${id}/sections/requested-item`);
  });
});
