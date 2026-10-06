# ADR-0003: Feature-based folder structure

**Status:** Accepted · **Date:** 2026-10-06 · **Decider:** Gabriel Girão

## Context
Structure is the first thing a new reader of the code sees. The app has three screens, an API layer, a mock backend,
and UI primitives that mirror Opstream's design system.

## Decision
```
src/app/
├── core/        models, API services, mock backend (no UI)
├── shared/ui/   presentational components that mirror the design system (no domain knowledge)
└── features/    schema-chooser, request-wizard, request-summary
```
The request being filled in (form, autosave, submission) lives in `core/request`, not in a feature:
the chooser starts it, the wizard edits it and the summary reads it, and features must not import each other.
Logic that matters lives in testable functions and services (`request-form.factory`, `autosave.service`),
not inside components.

## Options considered
- **By type** (`components/`, `services/`, `pages/`): familiar, but scatters one feature across many folders.
- **By feature — chosen:** a feature can be read, moved or deleted as one unit.

## Consequences
- `shared/ui` must never import from `features` or `core/api`.
- `shared/ui` is the natural seed for a Storybook later.
