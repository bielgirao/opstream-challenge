import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { RawRequestSchema } from '../models';
import { SchemaApiService } from './schema-api.service';

const RAW: RawRequestSchema[] = [
  {
    id: 'a',
    title: 'A',
    sections: [{ id: 's', title: 'S', fields: [{ id: 1, label: 'Name', type: 'text' }] }],
  },
  {
    id: 'b',
    title: 'B',
    sections: [{ id: 's', title: 'S', fields: [{ id: 2, label: 'File', type: 'upload' }] }],
  },
];

function setup() {
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  return { api: TestBed.inject(SchemaApiService), http: TestBed.inject(HttpTestingController) };
}

describe('SchemaApiService', () => {
  beforeEach(() => vi.spyOn(console, 'warn').mockImplementation(() => {}));
  afterEach(() => vi.restoreAllMocks());

  it('returns normalised schemas, dropping unrenderable ones', async () => {
    const { api, http } = setup();
    const result = firstValueFrom(api.getSchemas());
    http.expectOne('/api/schemas').flush(RAW);
    expect((await result).map((s) => s.id)).toEqual(['a']);
  });

  it('fetches once and serves later subscribers from cache', async () => {
    const { api, http } = setup();
    const first = firstValueFrom(api.getSchemas());
    http.expectOne('/api/schemas').flush(RAW);
    await first;

    const schema = await firstValueFrom(api.getSchema('a'));
    expect(schema?.title).toBe('A');
    http.expectNone('/api/schemas');
  });

  it('does not cache failures: the next call refetches', async () => {
    const { api, http } = setup();
    const failed = firstValueFrom(api.getSchemas());
    http.expectOne('/api/schemas').flush(null, { status: 500, statusText: 'Server Error' });
    await expect(failed).rejects.toBeTruthy();

    const retried = firstValueFrom(api.getSchemas());
    http.expectOne('/api/schemas').flush(RAW);
    expect(await retried).toHaveLength(1);
  });

  it('treats a non-array payload as no schemas', async () => {
    const { api, http } = setup();
    const result = firstValueFrom(api.getSchemas());
    http.expectOne('/api/schemas').flush({ unexpected: true });
    expect(await result).toEqual([]);
  });
});
