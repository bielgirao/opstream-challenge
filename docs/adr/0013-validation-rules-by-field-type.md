# ADR-0013: Validation rules inferred from field type, as pure functions

**Status:** Accepted · **Date:** 2026-10-06 · **Decider:** Gabriel Girão

## Context

The schema only says `required`. That lets through `"   "` as an Item Name and `-5` as a Quantity —
invalid input the user should be told about. The engine must stay schema-driven:
rules cannot depend on a field's label ("Quantity"), because labels change.

## Decision

Rules come from two sources only: **schema properties** and the **field type**.

| Source                                 | Rule                                                                                                                           | Error key                                |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| `required: true` on `text`             | Not empty after trimming                                                                                                       | `required`                               |
| `required: true` on `number` / `radio` | Has a value                                                                                                                    | `required`                               |
| `type: number`                         | Finite number (rejects `NaN`, `Infinity`)                                                                                      | `notANumber`                             |
| `type: number`                         | ≥ 0                                                                                                                            | `min`                                    |
| `type: number`                         | Whole number, unless the schema sets `decimalPlaces` (then at most that many decimals); never beyond `Number.MAX_SAFE_INTEGER` | `integer` / `decimalPlaces` / `tooLarge` |
| `type: radio`                          | Value is one of `options` (guards stale drafts after a schema change)                                                          | `invalidOption`                          |
| `type: toggle`                         | Never required; defaults to `default ?? false`                                                                                 | —                                        |

Structure — pure functions, no service:

```
core/forms/
├── validators.ts            generic ValidatorFns: requiredTrimmed, finiteNumber, oneOf(options)
├── field-validators.ts      validatorsFor(field): ValidatorFn[]   ← the single place rules are decided
├── validation-messages.ts   error key → user message ("This field is required")
└── field-error.pipe.ts      control errors → first message, for templates
```

### Numbers are whole unless the schema says otherwise

The schema only says `"type": "number"`, and both number fields in the brief are quantities, which are whole.
Inferring "integer" from the label "Quantity" would break the schema-driven premise, so:

- `number` means **whole number ≥ 0 by default**;
- a schema may opt into decimals with an optional `decimalPlaces` property (0–6), e.g. a unit price with `2`.

The brief's schemas stay untouched (no `decimalPlaces` → whole numbers). This is a small, documented
extension of the schema, and the first step of letting the schema drive rules (`min`, `max`, `pattern` later).

### Number fields only accept numbers

Validation alone is not enough for numbers: `<input type="number">` lets "e", "+", "-" (and, in Firefox,
any letter) through, then reports unparsable text to JavaScript as an empty value. An optional number
field would accept "1e" on screen and silently save `null`.

So number fields use a text input with `inputmode` (numeric / decimal) plus the `uiNumberInput` directive, which
blocks any insertion (typing, paste, drop) that the field cannot hold — anything but digits, plus one decimal
point with up to `decimalPlaces` digits when allowed — turns "," into "." (mobile pt-BR keyboards), and gives
the form `number | null`. Negative signs are
blocked at input time because every number must be >= 0. `finiteNumber` stays as a guard for values
that arrive by other routes (e.g. a restored draft).

## Options considered

- **Injectable service:** nothing to inject and no state; a service would only add `TestBed` to the tests.
- **Rules inside the form factory:** works, but mixes "how the form is built" with "what is valid".
- **Pure functions in `core/forms` — chosen:** trivially unit-tested, tree-shakeable, one file to read for every rule.
- **Infer from labels:** rejected; breaks the schema-driven premise.

## Consequences

- Adding a rule means editing `validatorsFor` and its test; components never change.
- If messages ever need i18n, `validation-messages.ts` becomes an `InjectionToken` — the only point that would need DI.
- The natural next step (README "with more time"): let the schema carry `min`, `max`, `pattern`, and have `validatorsFor` read them.
