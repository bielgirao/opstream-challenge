# ADR-0002: Angular 22 standalone; signals for UI state, RxJS for async flows

**Status:** Accepted · **Date:** 2026-10-06 · **Decider:** Gabriel Girão

## Context

The brief requires Angular 16+, Reactive Forms, no state library, and says to focus on Reactive Forms + RxJS.
Angular 22 is the current stable release.

## Decision

- Angular 22 (latest stable) with standalone components, no NgModules.
- **Reactive Forms** for all form state (no template-driven, no experimental Signal Forms).
- **RxJS** for anything over time: HTTP, autosave, retries, debouncing.
- **Signals** for synchronous view state: current section, loading flags, save status shown in templates.

## Options considered

- **Everything in RxJS:** consistent, but more `async` pipes and subscription handling in templates.
- **Everything in signals:** simpler templates, but the brief explicitly asks for RxJS, and signals are weak at time-based flows.
- **Split by responsibility — chosen:** each tool where it is strongest; the boundary is `toSignal()`.

## Consequences

- A simple rule for every new piece of state: "streams in RxJS, state in signals".
- Signal Forms is mentioned as a future option, not used.
