# ADR-0005: One FormGroup per request, one nested group per section

**Status:** Accepted · **Date:** 2026-10-06 · **Decider:** Gabriel Girão

## Context

Each section is a separate page. "Next" must be blocked while the current section is invalid.
The summary shows every answer. Schemas can change at any time.

## Decision

A pure function builds the form from the schema:
`FormGroup<{ [sectionId]: FormGroup<{ [fieldId]: FormControl }> }>`.

- Control keys are `String(field.id)` (IDs are large numbers; object keys are strings anyway).
- `required` and `default` are optional in the schema: missing `required` means optional; missing `default` means empty.
- Validators are resolved per field by `validatorsFor(field)` (see ADR-0013): schema properties plus rules inferred from the field type, never from its label.

## Options considered

- **One FormGroup per page:** values are lost between pages and the summary has to stitch them together.
- **One flat FormGroup:** per-section validity becomes manual bookkeeping.
- **Nested groups — chosen:** `form.get(sectionId).valid` gates "Next"; `form.getRawValue()` feeds the summary.

## Consequences

- Moving between sections never reloads anything.
- The factory is a pure function, so it is unit-tested against both schemas and edge cases.
