import { catchError, map, Observable, of, OperatorFunction, startWith } from 'rxjs';

/** The three states every async boundary must render (ADR-0009). */
export type LoadState<T> =
  | { status: 'loading' }
  | { status: 'error'; error: unknown }
  | { status: 'ready'; value: T };

/** Wraps a source so it never errors: loading → ready | error. */
export function toLoadState<T>(): OperatorFunction<T, LoadState<T>> {
  return (source: Observable<T>) =>
    source.pipe(
      map((value): LoadState<T> => ({ status: 'ready', value })),
      catchError((error: unknown) => of<LoadState<T>>({ status: 'error', error })),
      startWith<LoadState<T>>({ status: 'loading' }),
    );
}
