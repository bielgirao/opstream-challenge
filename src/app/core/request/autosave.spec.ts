import { HttpErrorResponse } from '@angular/common/http';
import { map, NEVER, Observable } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { aggregateSaveStatus, AnswerChange, autosave, isTransientError } from './autosave';

const OPTIONS = { debounceMs: 800, retryDelaysMs: [1000, 2000] };
const STATES = { p: 'pending', s: 'saving', d: 'saved', r: 'retrying', e: 'error' };
const serverError = new HttpErrorResponse({ status: 500 });
const badRequest = new HttpErrorResponse({ status: 400 });

const change = (value: string, questionId = 'q1'): AnswerChange => ({ questionId, value });

function scheduler() {
  return new TestScheduler((actual, expected) => expect(actual).toEqual(expected));
}

/** Marble test helper: only the state letters of one question are compared. */
const statesOf = (source: Observable<{ questionId: string; state: string }>, questionId = 'q1') =>
  source.pipe(map((e) => (e.questionId === questionId ? e.state : `${e.questionId}:${e.state}`)));

describe('autosave', () => {
  it('debounces changes and saves only the latest value', () => {
    const saved: string[] = [];
    scheduler().run(({ hot, cold, expectObservable }) => {
      const changes = hot('-a 99ms b', { a: change('a'), b: change('b') });
      const save = (c: AnswerChange) => {
        saved.push(c.value as string);
        return cold('300ms (x|)');
      };

      // pending on each change; save 800ms after the last one; saved 300ms later
      expectObservable(statesOf(autosave(changes, NEVER, save, {}, OPTIONS))).toBe(
        '-p 99ms p 799ms s 299ms d',
        STATES,
      );
    });
    expect(saved).toEqual(['b']);
  });

  it('cancels an in-flight save when a newer value is debounced (switchMap)', () => {
    scheduler().run(({ hot, cold, expectObservable, expectSubscriptions }) => {
      const changes = hot('-a 899ms b', { a: change('a'), b: change('b') });
      const saveA = cold('1000ms (x|)');
      const saveB = cold('1000ms (x|)');
      const save = (c: AnswerChange) => (c.value === 'a' ? saveA : saveB);

      expectObservable(statesOf(autosave(changes, NEVER, save, {}, OPTIONS))).toBe(
        '-p 799ms s 99ms p 799ms s 999ms d',
        STATES,
      );
      expectSubscriptions(saveA.subscriptions).toBe('801ms ^ 899ms !');
    });
  });

  it('retries transient failures, then succeeds', () => {
    scheduler().run(({ hot, cold, expectObservable }) => {
      let calls = 0;
      const save = () => (calls++ === 0 ? cold('100ms #', {}, serverError) : cold('100ms (x|)'));
      const changes = hot('-a', { a: change('a') });

      // fails at 901 → retrying, waits 1000ms, second attempt succeeds 100ms later
      expectObservable(statesOf(autosave(changes, NEVER, save, {}, OPTIONS))).toBe(
        '-p 799ms s 99ms r 1099ms d',
        STATES,
      );
    });
  });

  it('gives up after the configured retries', () => {
    scheduler().run(({ hot, cold, expectObservable }) => {
      const save = () => cold('100ms #', {}, serverError);
      const changes = hot('-a', { a: change('a') });

      // attempt 1 fails at 901, attempt 2 at 2001, attempt 3 at 4101 → error
      expectObservable(statesOf(autosave(changes, NEVER, save, {}, OPTIONS))).toBe(
        '-p 799ms s 99ms r 1099ms r 2099ms e',
        STATES,
      );
    });
  });

  it('does not retry client errors (4xx)', () => {
    scheduler().run(({ hot, cold, expectObservable }) => {
      const save = () => cold('100ms #', {}, badRequest);
      const changes = hot('-a', { a: change('a') });
      expectObservable(statesOf(autosave(changes, NEVER, save, {}, OPTIONS))).toBe(
        '-p 799ms s 99ms e',
        STATES,
      );
    });
  });

  it('saves immediately when flushed', () => {
    scheduler().run(({ hot, cold, expectObservable }) => {
      const changes = hot('-a', { a: change('a') });
      const flush = hot('---f');
      const save = () => cold('100ms (x|)');
      expectObservable(statesOf(autosave(changes, flush, save, {}, OPTIONS))).toBe(
        '-p-s 99ms d',
        STATES,
      );
    });
  });

  it('does not resend a value equal to the last saved one', () => {
    scheduler().run(({ hot, expectObservable }) => {
      const changes = hot('-a', { a: change('restored') });
      const save = () => {
        throw new Error('should not save');
      };
      expectObservable(statesOf(autosave(changes, NEVER, save, { q1: 'restored' }, OPTIONS))).toBe(
        '-p 799ms d',
        STATES,
      );
    });
  });

  it('saves different questions independently', () => {
    scheduler().run(({ hot, cold, expectObservable }) => {
      const changes = hot('-a-b', { a: change('x', 'q1'), b: change('y', 'q2') });
      const save = (c: AnswerChange) =>
        c.questionId === 'q1' ? cold('500ms (x|)') : cold('100ms (x|)');
      expectObservable(statesOf(autosave(changes, NEVER, save, {}, OPTIONS))).toBe(
        '-a-b 797ms c-d 99ms e 397ms f',
        {
          a: 'pending',
          b: 'q2:pending',
          c: 'saving',
          d: 'q2:saving',
          e: 'q2:saved',
          f: 'saved',
        },
      );
    });
  });
});

describe('isTransientError', () => {
  it('retries network and server errors only', () => {
    expect(isTransientError(new HttpErrorResponse({ status: 0 }))).toBe(true);
    expect(isTransientError(new HttpErrorResponse({ status: 503 }))).toBe(true);
    expect(isTransientError(new HttpErrorResponse({ status: 409 }))).toBe(false);
    expect(isTransientError(new Error('boom'))).toBe(true);
  });
});

describe('aggregateSaveStatus', () => {
  it.each([
    [{}, 'idle'],
    [{ a: 'saved', b: 'saved' }, 'saved'],
    [{ a: 'saved', b: 'pending' }, 'saving'],
    [{ a: 'saving', b: 'saved' }, 'saving'],
    [{ a: 'retrying', b: 'saving' }, 'retrying'],
    [{ a: 'error', b: 'retrying' }, 'error'],
  ] as const)('%j → %s', (states, expected) => {
    expect(aggregateSaveStatus(states)).toBe(expected);
  });
});
