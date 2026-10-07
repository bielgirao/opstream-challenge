import { HttpErrorResponse } from '@angular/common/http';
import { computed, DOCUMENT, inject, Injectable, InjectionToken, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  BehaviorSubject,
  catchError,
  defer,
  filter,
  fromEvent,
  map,
  merge,
  Observable,
  of,
  Subject,
  Subscription,
  switchMap,
  take,
  throwError,
} from 'rxjs';
import { RequestApiService, SchemaApiService } from '../api';
import { QuestionSaveState, RequestSchema } from '../models';
import {
  aggregateSaveStatus,
  AnswerChange,
  autosave,
  AutosaveOptions,
  DEFAULT_AUTOSAVE_OPTIONS,
  isSettled,
} from './autosave';
import {
  AnswerControl,
  Answers,
  buildRequestForm,
  controlsById,
  RequestForm,
} from './request-form';
import { RequestRegistry } from './request-registry';

export const AUTOSAVE_OPTIONS = new InjectionToken<AutosaveOptions>('AUTOSAVE_OPTIONS', {
  providedIn: 'root',
  factory: () => DEFAULT_AUTOSAVE_OPTIONS,
});

export interface ActiveRequest {
  id: string;
  schema: RequestSchema;
  form: RequestForm;
}

export type OpenResult = 'ready' | 'not-found';
export type FlushResult = 'saved' | 'error';
export type SubmitResult = 'submitted' | 'invalid' | 'save-failed';

type QuestionStates = Readonly<Record<string, QuestionSaveState>>;

/**
 * Owns the lifecycle of the request being filled in: its form, its autosave and its submission.
 * The chooser starts it, the wizard edits it, the summary reads it.
 *
 * It lives at the root (not in the wizard page) so a save in flight finishes even if the user
 * leaves the wizard, and so moving between sections never rebuilds anything.
 */
@Injectable({ providedIn: 'root' })
export class RequestSession {
  private readonly requestApi = inject(RequestApiService);
  private readonly schemaApi = inject(SchemaApiService);
  private readonly registry = inject(RequestRegistry);
  private readonly options = inject(AUTOSAVE_OPTIONS);
  private readonly window = inject(DOCUMENT).defaultView;

  private readonly states$ = new BehaviorSubject<QuestionStates>({});
  private readonly flush$ = new Subject<void>();
  private readonly resend$ = new Subject<AnswerChange>();
  private controls = new Map<string, AnswerControl>();
  private connection: Subscription | null = null;

  private readonly activeRequest = signal<ActiveRequest | null>(null);
  readonly active = this.activeRequest.asReadonly();
  /** Save state per field id. */
  readonly questionStates = toSignal(this.states$, { requireSync: true });
  readonly saveStatus = computed(() => aggregateSaveStatus(this.questionStates()));

  /** Starts a new request for a schema. No HTTP call: the first saved answer creates it. */
  start(schema: RequestSchema): ActiveRequest {
    const id = crypto.randomUUID();
    this.registry.register(id, schema.id);
    return this.activate(id, schema, {});
  }

  /**
   * Makes `requestId` the active request, restoring its saved answers (refresh, deep link).
   * Emits 'not-found' when neither the backend nor this tab knows the request; other
   * errors (e.g. the server failing) are passed on so the caller can offer a retry.
   */
  open(requestId: string): Observable<OpenResult> {
    if (this.activeRequest()?.id === requestId) return of('ready');

    return this.requestApi.getDraft(requestId).pipe(
      catchError((error: unknown) =>
        error instanceof HttpErrorResponse && error.status === 404
          ? of(null)
          : throwError(() => error),
      ),
      switchMap((draft) => {
        const schemaId = draft?.schemaId ?? this.registry.get(requestId)?.schemaId;
        if (!schemaId) return of<OpenResult>('not-found');

        return this.schemaApi.getSchema(schemaId).pipe(
          map((schema): OpenResult => {
            if (!schema) return 'not-found';
            this.registry.register(requestId, schemaId);
            this.activate(requestId, schema, draft?.answers ?? {});
            return 'ready';
          }),
        );
      }),
    );
  }

  isSubmitted(requestId: string): boolean {
    return this.registry.get(requestId)?.submitted === true;
  }

  /** Saves pending answers now and emits once nothing is in flight. */
  flush(): Observable<FlushResult> {
    return defer(() => {
      this.flush$.next();
      return this.states$.pipe(
        filter((states) => Object.values(states).every(isSettled)),
        take(1),
        map((states): FlushResult => (Object.values(states).includes('error') ? 'error' : 'saved')),
      );
    });
  }

  /** Validates, waits for every answer to be saved, then marks the request as submitted. */
  submit(): Observable<SubmitResult> {
    const request = this.activeRequest();
    if (!request || request.form.invalid) return of<SubmitResult>('invalid');

    return this.flush().pipe(
      map((result): SubmitResult => {
        if (result === 'error') return 'save-failed';
        this.registry.markSubmitted(request.id);
        this.disconnect();
        return 'submitted';
      }),
    );
  }

  /** Saves again every answer whose save gave up. */
  retryFailed(): void {
    for (const [questionId, state] of Object.entries(this.states$.value)) {
      const control = this.controls.get(questionId);
      if (state === 'error' && control) this.resend$.next({ questionId, value: control.value });
    }
    this.flush$.next();
  }

  /** Forgets the active request ("Create New Request"). Saved drafts stay on the server. */
  reset(): void {
    this.disconnect();
    this.activeRequest.set(null);
    this.controls = new Map();
    this.states$.next({});
  }

  private activate(id: string, schema: RequestSchema, answers: Answers): ActiveRequest {
    this.reset();
    const request: ActiveRequest = { id, schema, form: buildRequestForm(schema, answers) };
    this.controls = controlsById(request.form);
    this.activeRequest.set(request);
    this.connect(request, answers);
    return request;
  }

  private connect({ id, schema }: ActiveRequest, savedAnswers: Answers): void {
    const changes$ = merge(
      this.resend$,
      ...[...this.controls].map(([questionId, control]) =>
        control.valueChanges.pipe(map((value): AnswerChange => ({ questionId, value }))),
      ),
    );
    const save = ({ questionId, value }: AnswerChange) =>
      this.requestApi.saveAnswer(id, questionId, { schemaId: schema.id, value });

    this.connection = autosave(changes$, this.flush$, save, savedAnswers, this.options).subscribe(
      ({ questionId, state }) => this.states$.next({ ...this.states$.value, [questionId]: state }),
    );

    // Warn before closing the tab while answers are not saved yet.
    if (this.window) {
      this.connection.add(
        fromEvent<BeforeUnloadEvent>(this.window, 'beforeunload').subscribe((event) => {
          if (Object.values(this.states$.value).some((state) => state !== 'saved')) {
            event.preventDefault();
            event.returnValue = '';
          }
        }),
      );
    }
  }

  private disconnect(): void {
    this.connection?.unsubscribe();
    this.connection = null;
  }
}
