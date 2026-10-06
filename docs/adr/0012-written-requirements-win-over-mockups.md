# ADR-0012: Written requirements win over mockups

**Status:** Accepted · **Date:** 2026-10-06 · **Decider:** Gabriel Girão

## Context
The mockups are generic and conflict with the written brief:
they show "Long Text" and "Dropdown" (not allowed types), have no toggle,
and label the final button "Complete the flow and Reset" instead of "Create New Request".

## Decision
- When text and mockup disagree, the **written requirement wins**.
- Only `text | number | radio | toggle` are implemented; the toggle follows the design system.
- The final button reads **"Create New Request"**.
- Validation beyond what the schema states is defined in ADR-0013.

## Consequences
- Every deviation from the mockup is listed in the README with its reason.
