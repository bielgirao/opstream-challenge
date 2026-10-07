import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { SchemaApiService } from '../api';
import { MOCK_SCHEMAS } from '../mock-backend/schemas.data';
import { normalizeSchemas } from '../models';
import { controlsById } from './request-form';
import { REQUEST_REGISTRY_STORAGE } from './request-registry';
import { MemoryStorage } from '../../../testing/memory-storage';
import { AUTOSAVE_OPTIONS, RequestSession } from './request-session.service';

const [software] = normalizeSchemas(MOCK_SCHEMAS);
const ITEM = '1758177604';
const QTY = '75484637462';

function setup(storage = new MemoryStorage()) {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: AUTOSAVE_OPTIONS, useValue: { debounceMs: 800, retryDelaysMs: [] } },
      { provide: REQUEST_REGISTRY_STORAGE, useValue: storage },
      {
        provide: SchemaApiService,
        useValue: { getSchema: (id: string) => of([software].find((s) => s.id === id)) },
      },
    ],
  });
  return {
    session: TestBed.inject(RequestSession),
    http: TestBed.inject(HttpTestingController),
    storage,
  };
}

const control = (session: RequestSession, id: string) =>
  controlsById(session.active()!.form).get(id)!;

describe('RequestSession', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('starts a request without calling the API', () => {
    const { session, http } = setup();
    const request = session.start(software);
    expect(session.active()).toBe(request);
    expect(request.id).toMatch(/[0-9a-f-]{36}/);
    expect(session.saveStatus()).toBe('idle');
    http.verify();
  });

  it('autosaves a change after the debounce and reports the status', async () => {
    const { session, http } = setup();
    const { id } = session.start(software);

    control(session, ITEM).setValue('Figma');
    expect(session.saveStatus()).toBe('saving');

    await vi.advanceTimersByTimeAsync(800);
    const req = http.expectOne(`/api/requests/${id}/question/${ITEM}`);
    expect(req.request.body).toEqual({ schemaId: 'software-request', value: 'Figma' });

    req.flush({ questionId: ITEM, value: 'Figma', savedAt: '' });
    expect(session.saveStatus()).toBe('saved');
  });

  it('restores a saved draft', async () => {
    const { session, http } = setup();
    const result = firstValueFrom(session.open('r1'));
    http.expectOne('/api/requests/r1').flush({
      id: 'r1',
      schemaId: 'software-request',
      answers: { [ITEM]: 'Figma' },
      updatedAt: '',
    });

    expect(await result).toBe('ready');
    expect(control(session, ITEM).value).toBe('Figma');
    expect(session.saveStatus()).toBe('idle'); // restoring does not trigger saves
  });

  it('reopens a request started in this tab even before anything was saved', async () => {
    const storage = new MemoryStorage();
    const first = setup(storage);
    const { id } = first.session.start(software);
    TestBed.resetTestingModule();

    const { session, http } = setup(storage); // simulates a page reload
    const result = firstValueFrom(session.open(id));
    http.expectOne(`/api/requests/${id}`).flush(null, { status: 404, statusText: 'Not Found' });
    expect(await result).toBe('ready');
    expect(session.active()?.schema.id).toBe('software-request');
  });

  it('reports unknown requests as not found and passes other errors on', async () => {
    const { session, http } = setup();
    const missing = firstValueFrom(session.open('nope'));
    http.expectOne('/api/requests/nope').flush(null, { status: 404, statusText: 'Not Found' });
    expect(await missing).toBe('not-found');

    const failing = firstValueFrom(session.open('r2'));
    http.expectOne('/api/requests/r2').flush(null, { status: 500, statusText: 'Error' });
    await expect(failing).rejects.toMatchObject({ status: 500 });
  });

  describe('submit', () => {
    it('refuses an invalid request', async () => {
      const { session } = setup();
      session.start(software);
      expect(await firstValueFrom(session.submit())).toBe('invalid');
    });

    it('saves pending answers immediately, then marks the request as submitted', async () => {
      const { session, http } = setup();
      const { id, form } = session.start(software);
      form.patchValue({
        'requested-item': { [ITEM]: 'Figma', [QTY]: 2 },
        'vendor-info': { '4957463729': 'Figma Inc.', '8462736152': 'USA' },
      });

      const result = firstValueFrom(session.submit());
      // No debounce wait: flush sends every pending answer right away.
      const requests = http.match((r) => r.method === 'PUT');
      expect(requests).toHaveLength(4);
      requests.forEach((r) => r.flush({}));

      expect(await result).toBe('submitted');
      expect(session.isSubmitted(id)).toBe(true);
    });

    it('does not submit when a save failed', async () => {
      const { session, http } = setup();
      const { form } = session.start(software);
      form.patchValue({
        'requested-item': { [ITEM]: 'Figma', [QTY]: 2 },
        'vendor-info': { '4957463729': 'Figma Inc.', '8462736152': 'USA' },
      });

      const result = firstValueFrom(session.submit());
      const [first, ...rest] = http.match((r) => r.method === 'PUT');
      first.flush(null, { status: 500, statusText: 'Error' });
      rest.forEach((r) => r.flush({}));

      expect(await result).toBe('save-failed');
      expect(session.saveStatus()).toBe('error');
    });
  });

  it('retries failed saves on demand', async () => {
    const { session, http } = setup();
    const { id } = session.start(software);
    control(session, ITEM).setValue('Figma');
    await vi.advanceTimersByTimeAsync(800);
    http
      .expectOne(`/api/requests/${id}/question/${ITEM}`)
      .flush(null, { status: 500, statusText: 'Error' });
    expect(session.saveStatus()).toBe('error');

    session.retryFailed();
    http.expectOne(`/api/requests/${id}/question/${ITEM}`).flush({});
    expect(session.saveStatus()).toBe('saved');
  });

  it('reset forgets the active request and stops autosaving', async () => {
    const { session, http } = setup();
    session.start(software);
    const item = control(session, ITEM);
    session.reset();

    item.setValue('ignored');
    await vi.advanceTimersByTimeAsync(800);
    expect(session.active()).toBeNull();
    http.verify();
  });
});
