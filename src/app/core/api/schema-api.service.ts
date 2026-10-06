import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, shareReplay } from 'rxjs';
import { normalizeSchemas, RawRequestSchema, RequestSchema } from '../models';

/**
 * Request schemas. Fetched once and cached for the session (`shareReplay`), so moving from
 * the chooser into the wizard needs no second request. A failed fetch is not cached:
 * `shareReplay` resets on error, so the next subscriber (e.g. "Try again") refetches.
 */
@Injectable({ providedIn: 'root' })
export class SchemaApiService {
  private readonly http = inject(HttpClient);

  private readonly schemas$ = this.http.get<RawRequestSchema[]>('/api/schemas').pipe(
    map((raw) => (Array.isArray(raw) ? normalizeSchemas(raw) : [])),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  getSchemas(): Observable<readonly RequestSchema[]> {
    return this.schemas$;
  }

  /** Emits undefined when no schema has that id. */
  getSchema(schemaId: string): Observable<RequestSchema | undefined> {
    return this.schemas$.pipe(map((schemas) => schemas.find((s) => s.id === schemaId)));
  }
}
