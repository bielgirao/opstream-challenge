# ADR-0001: Scope — full brief plus visible extras

**Status:** Accepted · **Date:** 2026-10-06 · **Decider:** Gabriel Girão

## Context
The brief suggests ~2 hours. A form that autosaves under latency and random failures has many paths beyond the
happy one: empty data, slow network, bad input, lost saves. A production-minded solution should handle them visibly.

## Decision
Deliver everything in the brief, plus a small set of visible extras (~4–6h):
draft restore on refresh, guarded section navigation, flushing pending saves before submit,
unit tests for the form factory and the autosave pipeline, and basic accessibility
(focus on first invalid field, `aria-live` save status).

## Options considered
- **Minimum (~2h):** meets the brief, but leaves edge cases (refresh, failed saves, bad input) unhandled.
- **Brief + extras (~4–6h) — chosen:** covers edge cases and stays small enough to defend line by line.
- **Showcase (Storybook, E2E, deploy):** more coverage, but more surface than the problem needs.

## Consequences
- Each extra must be explained in the README and listed with its trade-off.
- Storybook, E2E tests and deploy go to the "with more time" list.
