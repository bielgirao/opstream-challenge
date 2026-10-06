# ADR-0011: Gilroy with Figtree fallback

**Status:** Accepted · **Date:** 2026-10-06 · **Decider:** Gabriel Girão

## Context
The design system uses Gilroy, a commercial font. Font files cannot be committed to a public repository without a license.

## Decision
`font-family: 'Gilroy', 'Figtree', system-ui, sans-serif;`
Figtree (Google Fonts, open license) is the closest free geometric match. Machines with Gilroy installed render the real font.

## Options considered
- **Commit Gilroy files:** license violation.
- **Gilroy via a personal font subscription kit:** ties the repo to a personal account.
- **Fallback stack — chosen.**

## Consequences
- Small visual differences from the design system, documented in the README.
