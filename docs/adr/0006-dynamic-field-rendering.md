# ADR-0006: Field rendering with @switch and ControlValueAccessor

**Status:** Accepted · **Date:** 2026-10-06 · **Decider:** Gabriel Girão

## Context
Allowed types are `text | number | radio | toggle`, and schemas can change.

## Decision
- A `DynamicField` component picks the control with `@switch (field.type)`.
- Radio group and toggle are reusable `ControlValueAccessor` components in `shared/ui`,
  so they plug into Reactive Forms like native inputs.
- An unknown `type` is skipped with a console warning; it never breaks the form.

## Options considered
- **Component registry + `NgComponentOutlet`:** more extensible, but overkill for four types.
- **`@switch` — chosen:** readable in one file; the registry goes to the "with more time" list.

## Consequences
- Adding a type means one new `@case` and, if needed, one new control.
- Malformed schemas degrade gracefully instead of crashing.
