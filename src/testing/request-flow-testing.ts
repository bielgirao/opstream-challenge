import { HttpErrorResponse } from '@angular/common/http';
import { EnvironmentProviders, Provider } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { routes } from '../app/app.routes';
import { RequestApiService, SchemaApiService } from '../app/core/api';
import { MOCK_SCHEMAS } from '../app/core/mock-backend/schemas.data';
import {
  normalizeSchemas,
  RequestDraft,
  RequestSchema,
  SaveAnswerResponse,
} from '../app/core/models';
import { AUTOSAVE_OPTIONS, REQUEST_REGISTRY_STORAGE } from '../app/core/request';
import { MemoryStorage } from './memory-storage';

export const [SOFTWARE_SCHEMA, HARDWARE_SCHEMA] = normalizeSchemas(MOCK_SCHEMAS);

/** Field ids of the software schema, for readable tests. */
export const SOFTWARE = {
  itemName: '1758177604',
  quantity: '75484637462',
  vendorName: '4957463729',
  vendorLocation: '8462736152',
  website: '6482937561',
} as const;

export const notFound = () => throwError(() => new HttpErrorResponse({ status: 404 }));
export const serverError = () => throwError(() => new HttpErrorResponse({ status: 500 }));

export interface FakeApis {
  schemas: () => Observable<readonly RequestSchema[]>;
  getDraft: (requestId: string) => Observable<RequestDraft>;
  saveAnswer: () => Observable<SaveAnswerResponse>;
}

/**
 * The real routes, guards and RequestSession, with the HTTP layer replaced by spies.
 * Autosave runs without debounce or retries so tests stay synchronous-ish.
 */
export function provideRequestFlowTesting(overrides: Partial<FakeApis> = {}): {
  providers: (Provider | EnvironmentProviders)[];
  apis: { [K in keyof FakeApis]: ReturnType<typeof vi.fn<FakeApis[K]>> };
} {
  const apis = {
    schemas: vi.fn<FakeApis['schemas']>(
      overrides.schemas ?? (() => of([SOFTWARE_SCHEMA, HARDWARE_SCHEMA])),
    ),
    getDraft: vi.fn<FakeApis['getDraft']>(overrides.getDraft ?? notFound),
    saveAnswer: vi.fn<FakeApis['saveAnswer']>(
      overrides.saveAnswer ?? (() => of({ questionId: '', value: null, savedAt: '' })),
    ),
  };

  return {
    apis,
    providers: [
      provideRouter(routes, withComponentInputBinding()),
      { provide: AUTOSAVE_OPTIONS, useValue: { debounceMs: 0, retryDelaysMs: [] } },
      { provide: REQUEST_REGISTRY_STORAGE, useValue: new MemoryStorage() },
      {
        provide: SchemaApiService,
        useValue: {
          getSchemas: () => apis.schemas(),
          getSchema: (id: string) =>
            new Observable<RequestSchema | undefined>((subscriber) =>
              apis.schemas().subscribe({
                next: (schemas) => subscriber.next(schemas.find((s) => s.id === id)),
                error: (e) => subscriber.error(e),
                complete: () => subscriber.complete(),
              }),
            ),
        },
      },
      {
        provide: RequestApiService,
        useValue: { getDraft: apis.getDraft, saveAnswer: apis.saveAnswer },
      },
    ],
  };
}

/** Types into a field the way the browser does: set the value, fire `input`. */
export function typeInto(root: HTMLElement, selector: string, value: string): void {
  const input = root.querySelector<HTMLInputElement>(selector);
  if (!input) throw new Error(`No input ${selector}`);
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

export function clickButton(root: HTMLElement, text: string): void {
  const button = [...root.querySelectorAll<HTMLButtonElement>('button')].find(
    (b) => b.textContent?.trim() === text,
  );
  if (!button) throw new Error(`No button "${text}"`);
  button.click();
}

export const errorsIn = (root: HTMLElement) =>
  [...root.querySelectorAll('.ui-field-card__error')].map((e) => e.textContent?.trim());
