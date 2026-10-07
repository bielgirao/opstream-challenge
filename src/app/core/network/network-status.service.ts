import { DOCUMENT, inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  distinctUntilChanged,
  filter,
  fromEvent,
  map,
  merge,
  Observable,
  of,
  pairwise,
  shareReplay,
  startWith,
} from 'rxjs';

/**
 * Whether the browser has a network connection, from `navigator.onLine` and the
 * `online` / `offline` window events.
 */
@Injectable({ providedIn: 'root' })
export class NetworkStatus {
  private readonly window = inject(DOCUMENT).defaultView;

  readonly online$: Observable<boolean> = this.window
    ? merge(
        fromEvent(this.window, 'online').pipe(map(() => true)),
        fromEvent(this.window, 'offline').pipe(map(() => false)),
      ).pipe(
        startWith(this.window.navigator.onLine),
        distinctUntilChanged(),
        shareReplay({ bufferSize: 1, refCount: true }),
      )
    : of(true);

  readonly online = toSignal(this.online$, { requireSync: true });

  /** Emits each time the connection comes back after being lost. */
  readonly reconnected$: Observable<void> = this.online$.pipe(
    pairwise(),
    filter(([before, now]) => !before && now),
    map(() => undefined),
  );
}
