# ADR-0007: URL-driven wizard with a forward-navigation guard

**Status:** Accepted · **Date:** 2026-10-06 · **Decider:** Gabriel Girão

## Context
Routes are up to us. The mockup has a clickable section sidebar, while "Next" must be blocked on invalid input.
The PUT contract needs a request id, but there is no "create request" endpoint.

## Decision
```
/requests/new                               schema chooser
/requests/:requestId/sections/:sectionId    wizard
/requests/:requestId/summary                read-only summary
```
- The request id is generated on the client (`crypto.randomUUID()`) when the user clicks Start.
- A guard only allows a section if every previous section is valid, so the URL cannot skip validation.
- The sidebar uses the same rule: future sections are disabled until reachable.

## Options considered
- **State-only wizard (no URL per section):** simpler, but refresh and deep links break.
- **URL per section without guard:** typing a URL bypasses validation.
- **URL + guard — chosen.**

## Consequences
- Refresh and browser back/forward work naturally.
- Generating ids on the client is documented as an assumption; a real backend would issue them.
