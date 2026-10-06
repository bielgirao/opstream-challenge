# ADR-0010: Mockup layout + Opstream design system tokens

**Status:** Accepted · **Date:** 2026-10-06 · **Decider:** Gabriel Girão

## Context
The brief says to follow the mockups for general direction and keep styling minimal.
Opstream's design system (view-only) differs in details: floating labels, pill radios, its own toggle, notifications and loaders.
Assets cannot be exported.

## Decision
- **Layout** follows the challenge mockups (sidebar + card per question; label above the input).
- **Visual language** follows the design system: colour, type scale, borders, error state,
  pill radio, toggle, notification, loader, primary button states.
- Tokens become CSS custom properties (`--color-brand-main`, `--radius-micro`…), named after the design system.
- `shared/ui` components mirror the design system's API (e.g. Button: `style`, `size`, `state`, `icon`).
- No UI library (Angular Material etc.): it would fight the design system and add weight.
- A working Figma file holds the reconstructed screens and components as a reference.

## Consequences
- The result reads as the mockup's layout in the design system's visual language.
- Values not confirmed from the design system are marked as assumptions in the tokens file.
