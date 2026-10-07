import { HttpErrorResponse } from '@angular/common/http';
import {
  catchError,
  concat,
  debounce,
  groupBy,
  map,
  merge,
  mergeMap,
  Observable,
  of,
  race,
  share,
  switchMap,
  timer,
} from 'rxjs';
import { AggregateSaveStatus, AnswerValue, QuestionSaveState } from '../models';

export interface AnswerChange {
  questionId: string;
  value: AnswerValue;
}

export interface QuestionStateChange {
  questionId: string;
  state: QuestionSaveState;
}

export interface AutosaveOptions {
  /** Quiet time after the last change before saving. */
  debounceMs: number;
  /** One entry per retry: the wait before it. The brief asks for 1–2 retries. */
  retryDelaysMs: readonly number[];
}

export const DEFAULT_AUTOSAVE_OPTIONS: AutosaveOptions = {
  debounceMs: 800,
  retryDelaysMs: [1000, 2000],
};

/** Network errors (status 0) and 5xx are worth retrying; 4xx would fail again. */
export function isTransientError(error: unknown): boolean {
  return !(error instanceof HttpErrorResponse) || error.status === 0 || error.status >= 500;
}

/**
 * The autosave pipeline (ADR-0014), as a pure function of its inputs:
 *
 *   changes$ ─ groupBy(questionId) ─┬─ every change            → 'pending'
 *                                   └─ debounce (or flush$)
 *                                      → skip if equal to last saved value → 'saved'
 *                                      → switchMap(save)        → 'saving' → 'saved'
 *                                        transient error         → 'retrying' → (wait) → save again
 *                                        retries exhausted / 4xx → 'error'
 *
 * - One lane per question: questions save in parallel and never block each other.
 * - `switchMap`: a newer value cancels an in-flight save of the same question. Safe because
 *   PUT is idempotent and the newer request carries the full value.
 * - `flush$` releases every pending debounce immediately (used before submit).
 * - `savedValues` seeds "last saved" per question, so restoring a draft and typing the same
 *   value back does not resend it.
 */
export function autosave(
  changes$: Observable<AnswerChange>,
  flush$: Observable<unknown>,
  save: (change: AnswerChange) => Observable<unknown>,
  savedValues: Readonly<Record<string, AnswerValue>>,
  options: AutosaveOptions = DEFAULT_AUTOSAVE_OPTIONS,
): Observable<QuestionStateChange> {
  return changes$.pipe(
    groupBy((change) => change.questionId),
    mergeMap((lane$) => {
      const questionId = lane$.key;
      const stateOf = (state: QuestionSaveState): QuestionStateChange => ({ questionId, state });

      let hasSaved = Object.hasOwn(savedValues, questionId);
      let lastSaved = savedValues[questionId];

      const attempt = (change: AnswerChange, retry: number): Observable<QuestionStateChange> =>
        save(change).pipe(
          map(() => {
            hasSaved = true;
            lastSaved = change.value;
            return stateOf('saved');
          }),
          catchError((error: unknown) =>
            retry < options.retryDelaysMs.length && isTransientError(error)
              ? concat(
                  of(stateOf('retrying')),
                  timer(options.retryDelaysMs[retry]).pipe(
                    switchMap(() => attempt(change, retry + 1)),
                  ),
                )
              : of(stateOf('error')),
          ),
        );

      const changes = lane$.pipe(share());
      return merge(
        changes.pipe(map(() => stateOf('pending'))),
        changes.pipe(
          debounce(() => race(timer(options.debounceMs), flush$)),
          switchMap((change) =>
            hasSaved && Object.is(change.value, lastSaved)
              ? of(stateOf('saved'))
              : concat(of(stateOf('saving')), attempt(change, 0)),
          ),
        ),
      );
    }),
  );
}

/**
 * One status for the whole request, by priority:
 * error › retrying › saving (pending or saving) › saved › idle (nothing changed yet).
 */
export function aggregateSaveStatus(
  states: Readonly<Record<string, QuestionSaveState>>,
): AggregateSaveStatus {
  const values = Object.values(states);
  if (values.length === 0) return 'idle';
  if (values.includes('error')) return 'error';
  if (values.includes('retrying')) return 'retrying';
  if (values.includes('pending') || values.includes('saving')) return 'saving';
  return 'saved';
}

/** Settled = nothing left in flight for that question. */
export const isSettled = (state: QuestionSaveState) => state === 'saved' || state === 'error';
