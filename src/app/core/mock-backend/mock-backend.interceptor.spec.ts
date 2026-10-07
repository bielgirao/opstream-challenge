import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { RawRequestSchema, RequestDraft, SaveAnswerResponse } from '../models';
import { mockBackendInterceptor } from './mock-backend.interceptor';
import { MOCK_BACKEND_CONFIG, MockBackendConfig } from './mock-config';
import { MOCK_STORAGE } from './mock-db';

const instant = { latencyMs: [0, 0] as const, failureRate: 0 };
const ITEM_NAME = '1758177604';

function setup(overrides: Partial<MockBackendConfig> = {}) {
  const config: MockBackendConfig = {
    getSchemas: instant,
    getDraft: instant,
    saveAnswer: instant,
    random: () => 0.5,
    ...overrides,
  };
  const store = new Map<string, string>();
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withInterceptors([mockBackendInterceptor])),
      { provide: MOCK_BACKEND_CONFIG, useValue: config },
      {
        provide: MOCK_STORAGE,
        useValue: {
          getItem: (k: string) => store.get(k) ?? null,
          setItem: (k: string, v: string) => store.set(k, v),
        },
      },
    ],
  });
  return TestBed.inject(HttpClient);
}

const statusOf = (promise: Promise<unknown>) =>
  promise.then(
    () => 200,
    (e: HttpErrorResponse) => e.status,
  );

describe('mockBackendInterceptor', () => {
  it('GET /api/schemas returns both schemas', async () => {
    const http = setup();
    const schemas = await firstValueFrom(http.get<RawRequestSchema[]>('/api/schemas'));
    expect(schemas.map((s) => s.id)).toEqual(['software-request', 'hardware-request']);
  });

  it('PUT upserts an answer that GET /api/requests/:id then returns', async () => {
    const http = setup();
    const saved = await firstValueFrom(
      http.put<SaveAnswerResponse>(`/api/requests/r1/question/${ITEM_NAME}`, {
        schemaId: 'software-request',
        value: 'Laptop',
      }),
    );
    expect(saved).toMatchObject({ questionId: ITEM_NAME, value: 'Laptop' });

    const draft = await firstValueFrom(http.get<RequestDraft>('/api/requests/r1'));
    expect(draft).toMatchObject({
      id: 'r1',
      schemaId: 'software-request',
      answers: { [ITEM_NAME]: 'Laptop' },
    });
  });

  it('GET of an unknown request is a 404', async () => {
    const http = setup();
    expect(await statusOf(firstValueFrom(http.get('/api/requests/missing')))).toBe(404);
  });

  it('validates the PUT body, schema and question', async () => {
    const http = setup();
    const put = (url: string, body: unknown) => statusOf(firstValueFrom(http.put(url, body)));

    expect(await put(`/api/requests/r1/question/${ITEM_NAME}`, { value: 'x' })).toBe(400);
    expect(
      await put(`/api/requests/r1/question/${ITEM_NAME}`, { schemaId: 'nope', value: 'x' }),
    ).toBe(404);
    expect(
      await put('/api/requests/r1/question/999', { schemaId: 'software-request', value: 'x' }),
    ).toBe(400);
  });

  it('refuses to move a request to another schema', async () => {
    const http = setup();
    await firstValueFrom(
      http.put(`/api/requests/r1/question/${ITEM_NAME}`, {
        schemaId: 'software-request',
        value: 'a',
      }),
    );
    const status = await statusOf(
      firstValueFrom(
        http.put('/api/requests/r1/question/75329829348985', {
          schemaId: 'hardware-request',
          value: 'b',
        }),
      ),
    );
    expect(status).toBe(409);
  });

  it('fails with 500 according to the failure rate, without writing', async () => {
    const http = setup({ saveAnswer: { latencyMs: [0, 0], failureRate: 1 } });
    const status = await statusOf(
      firstValueFrom(
        http.put(`/api/requests/r1/question/${ITEM_NAME}`, {
          schemaId: 'software-request',
          value: 'x',
        }),
      ),
    );
    expect(status).toBe(500);
    expect(await statusOf(firstValueFrom(http.get('/api/requests/r1')))).toBe(404);
  });

  it('waits for the configured latency', async () => {
    vi.useFakeTimers();
    try {
      const http = setup({
        saveAnswer: { latencyMs: [600, 1000], failureRate: 0 },
        random: () => 0.5,
      });
      let done = false;
      http
        .put(`/api/requests/r1/question/${ITEM_NAME}`, { schemaId: 'software-request', value: 'x' })
        .subscribe(() => (done = true));

      await vi.advanceTimersByTimeAsync(799);
      expect(done).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      expect(done).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('lets non-API requests through', async () => {
    const http = setup();
    // No backend in tests: a pass-through request fails at the network level, not with a mock 404.
    const status = await statusOf(firstValueFrom(http.get('/assets/logo.svg')));
    expect(status).not.toBe(404);
  });
});
