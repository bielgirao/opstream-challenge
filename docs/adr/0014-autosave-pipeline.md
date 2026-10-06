# ADR-0014: Autosave pipeline

**Status:** Accepted · **Date:** 2026-10-06 · **Decider:** Gabriel Girão

## Context
Answers must autosave "at a reasonable interval" via `PUT /api/requests/:id/question/:questionId`
(600–1000ms latency, 10–20% random failures), retry 1–2 times, and show `Saving…`, `Saved`, `Error – retrying…`.

## Decision
```
each FormControl.valueChanges → { questionId, value }
  merge → groupBy(questionId)                 one independent lane per question
    per lane: debounce 800ms (or flush) → distinctUntilChanged
              → switchMap(PUT) with retry ×2, backoff 1s/2s, transient errors only (5xx / network)
  → per-question status: pending | saving | retrying | saved | error
  → aggregate status signal + per-section status (sidebar icons)
```

| Point | Choice | Why |
|---|---|---|
| Granularity | One lane per question (`groupBy`) | The contract is per question; questions save in parallel. |
| Same-question concurrency | `switchMap` | Latest value wins. Safe because PUT is idempotent. `concatMap` would queue stale values. |
| Interval | 800ms debounce | Reasonable interval without saving every keystroke. |
| Retry | 2 retries, backoff, transient errors only | Brief asks for 1–2; retrying a 4xx is pointless. |
| After retries fail | `error` state + "Retry" action | The user must know a save was lost; the brief's three labels don't cover "gave up". |
| Invalid values | **Saved anyway** | A draft is incomplete by nature. Validation gates Next/Submit, not saving. Losing typed input is worse. |
| Submit | `flush()` fires pending debounces, waits for all `saved`; any `error` blocks submit | Prevents submitting with the last field unsaved. |
| Draft restore | `patchValue(…, { emitEvent: false })` | Restoring must not trigger PUTs. |
| Lifecycle | Service provided by the wizard page; torn down with `takeUntilDestroyed` | One pipeline per request. |
| Closing the tab | `beforeunload` warning while saves are pending | Cheap protection against data loss. |

Aggregate status priority: `error` → "Couldn't save · Retry" › `retrying` → "Error – retrying…" › `pending`/`saving` → "Saving…" › all `saved` → "Saved" › nothing yet → hidden.

## Options considered
- **Save the whole form on an interval (`interval` + full payload):** simpler, but the contract is per question and it resends unchanged data.
- **One global queue (`concatMap`):** strict ordering, but one slow PUT delays every other field.
- **Per-question lanes with `switchMap` — chosen.**

## Consequences
- Tested with marble tests (`TestScheduler`) and a deterministic mock config: debounce, cancellation, retry, give-up, flush.
- Server-side validation would happen on submit; documented in the README.
