import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { RequestDraft } from '../../core/models';
import { RequestSession } from '../../core/request';
import {
  clickButton,
  errorsIn,
  FakeApis,
  notFound,
  provideRequestFlowTesting,
  serverError,
  SOFTWARE,
  SOFTWARE_SCHEMA,
  typeInto,
} from '../../../testing/request-flow-testing';
import { RequestWizardPage } from './request-wizard.page';

async function setup(overrides: Partial<FakeApis> = {}) {
  const { providers, apis } = provideRequestFlowTesting(overrides);
  TestBed.configureTestingModule({ providers });
  const harness = await RouterTestingHarness.create();
  const session = TestBed.inject(RequestSession);
  const router = TestBed.inject(Router);
  const stable = () => harness.fixture.whenStable();
  return {
    harness,
    apis,
    session,
    router,
    stable,
    el: () => harness.routeNativeElement as HTMLElement,
  };
}

async function startRequest() {
  const ctx = await setup();
  const { id } = ctx.session.start(SOFTWARE_SCHEMA);
  await ctx.harness.navigateByUrl(`/requests/${id}/sections/requested-item`, RequestWizardPage);
  await ctx.stable();
  return { ...ctx, id };
}

async function fillFirstSection(ctx: Awaited<ReturnType<typeof startRequest>>) {
  typeInto(ctx.el(), `#field-${SOFTWARE.itemName}`, 'Figma');
  typeInto(ctx.el(), `#field-${SOFTWARE.quantity}`, '3');
  await ctx.stable();
}

describe('RequestWizardPage', () => {
  it('renders the current section with its fields', async () => {
    const { el } = await startRequest();
    expect(el().querySelector('h1')?.textContent).toBe('Requested Item');
    expect(
      [...el().querySelectorAll('.ui-field-card__label')].map((l) => l.textContent?.trim()),
    ).toEqual(['Item Name', 'Quantity']);
  });

  it('blocks Next on invalid input, showing errors and focusing the first invalid field', async () => {
    const { el, router, stable, id } = await startRequest();
    clickButton(el(), 'Next');
    await stable();
    await new Promise((resolve) => requestAnimationFrame(resolve));

    expect(errorsIn(el())).toEqual(['This field is required', 'This field is required']);
    expect(document.activeElement?.id).toBe(`field-${SOFTWARE.itemName}`);
    expect(router.url).toBe(`/requests/${id}/sections/requested-item`);
  });

  it('moves to the next section when the current one is valid', async () => {
    const ctx = await startRequest();
    await fillFirstSection(ctx);
    clickButton(ctx.el(), 'Next');
    await ctx.stable();

    expect(ctx.router.url).toBe(`/requests/${ctx.id}/sections/vendor-info`);
    expect(ctx.el().querySelector('h1')?.textContent).toBe('Vendor Information');
    const buttons = [...ctx.el().querySelectorAll('app-wizard-actions button')].map((b) =>
      b.textContent?.trim(),
    );
    expect(buttons).toEqual(['Previous', 'Submit']);
  });

  it('autosaves answers and shows the save status', async () => {
    const ctx = await startRequest();
    typeInto(ctx.el(), `#field-${SOFTWARE.itemName}`, 'Figma');
    await new Promise((resolve) => setTimeout(resolve)); // debounce is 0ms in tests
    await ctx.stable();

    expect(ctx.apis.saveAnswer).toHaveBeenCalledTimes(1);
    expect(ctx.el().querySelector('ui-save-indicator')?.textContent).toContain('Saved');
  });

  it('submits a valid request and opens its summary', async () => {
    const ctx = await startRequest();
    await fillFirstSection(ctx);
    clickButton(ctx.el(), 'Next');
    await ctx.stable();
    typeInto(ctx.el(), `#field-${SOFTWARE.vendorName}`, 'Figma Inc.');
    ctx
      .el()
      .querySelector<HTMLInputElement>(
        `input[name="field-${SOFTWARE.vendorLocation}"][value="UK"]`,
      )!
      .click();
    await ctx.stable();

    clickButton(ctx.el(), 'Submit');
    await ctx.stable();

    expect(ctx.session.isSubmitted(ctx.id)).toBe(true);
    expect(ctx.router.url).toBe(`/requests/${ctx.id}/summary`);
  });

  it('blocks submit with a notification when a save failed', async () => {
    const ctx = await setup({ saveAnswer: serverError });
    const { id, form } = ctx.session.start(SOFTWARE_SCHEMA);
    form.patchValue({
      'requested-item': { [SOFTWARE.itemName]: 'Figma', [SOFTWARE.quantity]: 3 },
      'vendor-info': { [SOFTWARE.vendorName]: 'Figma Inc.', [SOFTWARE.vendorLocation]: 'UK' },
    });
    await ctx.harness.navigateByUrl(`/requests/${id}/sections/vendor-info`, RequestWizardPage);
    await ctx.stable();

    clickButton(ctx.el(), 'Submit');
    await ctx.stable();

    expect(ctx.el().textContent).toContain("Some answers weren't saved");
    expect(ctx.router.url).toBe(`/requests/${id}/sections/vendor-info`);
  });

  it('redirects to the first section when a later one is not reachable yet', async () => {
    const ctx = await setup();
    const { id } = ctx.session.start(SOFTWARE_SCHEMA);
    await ctx.harness.navigateByUrl(`/requests/${id}/sections/vendor-info`);
    await ctx.stable();
    expect(ctx.router.url).toBe(`/requests/${id}/sections/requested-item`);
  });

  it('restores a saved draft after a refresh', async () => {
    const draft: RequestDraft = {
      id: 'r1',
      schemaId: 'software-request',
      answers: { [SOFTWARE.itemName]: 'Figma', [SOFTWARE.quantity]: 3 },
      updatedAt: '',
    };
    const ctx = await setup({ getDraft: () => of(draft) });
    await ctx.harness.navigateByUrl('/requests/r1/sections/vendor-info', RequestWizardPage);
    await ctx.stable();

    expect(ctx.el().querySelector('h1')?.textContent).toBe('Vendor Information');
    expect(ctx.session.active()?.form.value['requested-item']).toEqual({
      [SOFTWARE.itemName]: 'Figma',
      [SOFTWARE.quantity]: 3,
    });
  });

  it('says so when the request does not exist', async () => {
    const ctx = await setup({ getDraft: notFound });
    await ctx.harness.navigateByUrl('/requests/unknown/sections/requested-item', RequestWizardPage);
    await ctx.stable();
    expect(ctx.el().textContent).toContain("We couldn't find this request");
  });

  it('offers a retry when the request fails to load', async () => {
    let attempts = 0;
    const draft: RequestDraft = {
      id: 'r1',
      schemaId: 'software-request',
      answers: {},
      updatedAt: '',
    };
    const ctx = await setup({ getDraft: () => (attempts++ === 0 ? serverError() : of(draft)) });
    await ctx.harness.navigateByUrl('/requests/r1/sections/requested-item', RequestWizardPage);
    await ctx.stable();
    expect(ctx.el().textContent).toContain("We couldn't load this request");

    clickButton(ctx.el(), 'Try again');
    await ctx.stable();
    expect(ctx.el().querySelector('h1')?.textContent).toBe('Requested Item');
  });
});
