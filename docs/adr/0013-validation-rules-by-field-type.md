# ADR-0013: Validation rules inferred from field type, as pure functions

**Status:** Accepted · **Date:** 2026-10-06 · **Decider:** Gabriel Girão

## Context
The schema only says `required`. That lets through `"   "` as an Item Name and `-5` as a Quantity —
invalid input the user should be told about. The engine must stay schema-driven:
rules cannot depend on a field's label ("Quantity"), because labels change.

## Decision
Rules come from two sources only: **schema properties** and the **field type**.

| Source | Rule | Error key |
|---|---|---|
| `required: true` on `text` | Not empty after trimming | `required` |
| `required: true` on `number` / `radio` | Has a value | `required` |
| `type: number` | Finite number (rejects `NaN`, `Infinity`) | `notANumber` |
| `type: number` | ≥ 0 | `min` |
| `type: radio` | Value is one of `options` (guards stale drafts after a schema change) | `invalidOption` |
| `type: toggle` | Never required; defaults to `default ?? false` | — |

Structure — pure functions, no service:
```
core/forms/
├── validators.ts            generic ValidatorFns: requiredTrimmed, finiteNumber, oneOf(options)
├── field-validators.ts      validatorsFor(field): ValidatorFn[]   ← the single place rules are decided
├── validation-messages.ts   error key → user message ("This field is required")
└── field-error.pipe.ts      control errors → first message, for templates
```

## Options considered
- **Injectable service:** nothing to inject and no state; a service would only add `TestBed` to the tests.
- **Rules inside the form factory:** works, but mixes "how the form is built" with "what is valid".
- **Pure functions in `core/forms` — chosen:** trivially unit-tested, tree-shakeable, one file to read for every rule.
- **Infer from labels:** rejected; breaks the schema-driven premise.

## Consequences
- Adding a rule means editing `validatorsFor` and its test; components never change.
- If messages ever need i18n, `validation-messages.ts` becomes an `InjectionToken` — the only point that would need DI.
- The natural next step (README "with more time"): let the schema carry `min`, `max`, `pattern`, and have `validatorsFor` read them.
