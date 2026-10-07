# ADR-0009: Loading, empty and error states

**Status:** Accepted · **Date:** 2026-10-06 · **Decider:** Gabriel Girão

## Context

Every async boundary (loading schemas, restoring a draft, saving answers, submitting) can be slow, empty or fail.

## Decision

| Moment                  | Behaviour                                                                                                   |
| ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| Chooser loading schemas | Skeleton chips, Start disabled                                                                              |
| Schemas failed          | Error notification with "Try again"                                                                         |
| No schemas              | Empty state message                                                                                         |
| Start → wizard          | Instant: schemas cached with `shareReplay`                                                                  |
| Refresh / deep link     | Skeleton cards while schema + draft load                                                                    |
| Between sections        | No loading (same FormGroup)                                                                                 |
| Typing                  | Save status, announced with `aria-live="polite"`                                                            |
| Submit                  | Button in loading state; waits for pending saves; blocks with a notification if a save failed after retries |
| Invalid "Next"/"Submit" | Fields marked as touched, errors shown, focus moves to the first invalid field                              |

## Consequences

- Every async boundary has a visible loading, error and empty path.
- These states are listed in the README with instructions to trigger each one.
