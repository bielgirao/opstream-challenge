import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, Subject, throwError } from 'rxjs';
import { RequestSchema } from '../../core/models';
import { RequestSession } from '../../core/request';
import {
  clickButton,
  FakeApis,
  HARDWARE_SCHEMA,
  provideRequestFlowTesting,
  SOFTWARE_SCHEMA,
} from '../../../testing/request-flow-testing';
import { SchemaChooserPage } from './schema-chooser.page';

async function open(schemas: FakeApis['schemas']) {
  const { providers, apis } = provideRequestFlowTesting({ schemas });
  TestBed.configureTestingModule({ providers });
  const harness = await RouterTestingHarness.create();
  await harness.navigateByUrl('/requests/new', SchemaChooserPage);
  await harness.fixture.whenStable();
  return { harness, apis, el: harness.routeNativeElement as HTMLElement };
}

describe('SchemaChooserPage', () => {
  it('shows skeletons and a disabled Start while loading', async () => {
    const pending = new Subject<readonly RequestSchema[]>();
    const { el } = await open(() => pending);
    expect(el.querySelectorAll('ui-skeleton')).toHaveLength(2);
    expect(el.querySelector<HTMLButtonElement>('button[uibutton]')?.disabled).toBe(true);
  });

  it('lists the schemas with the first one preselected', async () => {
    const { el } = await open(() => of([SOFTWARE_SCHEMA, HARDWARE_SCHEMA]));
    const chips = [...el.querySelectorAll('button[uichip]')];
    expect(chips.map((c) => c.textContent?.trim())).toEqual(['Software Request', 'Hardware Request']);
    expect(chips.map((c) => c.getAttribute('aria-pressed'))).toEqual(['true', 'false']);
  });

  it('starts a request for the selected schema and opens its first section', async () => {
    const { harness, el } = await open(() => of([SOFTWARE_SCHEMA, HARDWARE_SCHEMA]));
    el.querySelectorAll<HTMLButtonElement>('button[uichip]')[1].click();
    await harness.fixture.whenStable();
    clickButton(el, 'Start');
    await harness.fixture.whenStable();

    const request = TestBed.inject(RequestSession).active();
    expect(request?.schema.id).toBe('hardware-request');
    expect(TestBed.inject(Router).url).toBe(`/requests/${request?.id}/sections/requested-item`);
  });

  it('offers a retry when loading fails, and refetches', async () => {
    let attempts = 0;
    const { harness, el } = await open(() =>
      attempts++ === 0 ? throwError(() => new Error('offline')) : of([SOFTWARE_SCHEMA]),
    );
    expect(el.querySelector('ui-notification[data-type="error"]')?.textContent).toContain(
      "We couldn't load the request types",
    );

    clickButton(el, 'Try again');
    await harness.fixture.whenStable();
    expect(el.querySelectorAll('button[uichip]')).toHaveLength(1);
  });

  it('explains when there is nothing to request', async () => {
    const { el } = await open(() => of([]));
    expect(el.textContent).toContain('No request types available');
    expect(el.querySelector('button[uichip]')).toBeNull();
  });
});
