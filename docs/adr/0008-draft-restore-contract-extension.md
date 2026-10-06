# ADR-0008: Add GET /api/requests/:id to restore drafts

**Status:** Accepted · **Date:** 2026-10-06 · **Decider:** Gabriel Girão

## Context
Answers are autosaved, but the contract has no way to read them back.
Without it, a refresh loses everything, which defeats the purpose of autosave.

## Decision
- Extend the mock contract with `GET /api/requests/:id`, returning the schema id and saved answers.
- The mock database is persisted in `localStorage`, so it survives a page reload.
- On wizard load: fetch the draft, patch the form with `emitEvent: false` (so restoring does not trigger saves).

## Options considered
- **Stick to the contract:** faithful, but refresh loses data.
- **Restore from the client's own `localStorage`:** works, but bypasses the API and hides what the backend should own.
- **Extend the contract — chosen**, and say so clearly in the README.

## Consequences
- One endpoint beyond the brief, flagged as a deliberate extension.
- "Create New Request" clears the current request id; old drafts remain in the mock DB.
