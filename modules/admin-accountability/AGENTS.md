# AGENTS.md — admin-accountability work protocol

Before touching any file in this module:

1. Read [[CLAUDE.md]] (scope + the accountability loop) and [[CONTEXT.md]] (the baseline + band reconciliation) fully.
2. This module depends on `@nid/core` **only**. Do not import other modules; do not let other modules import this one in a way that forms a cycle. The boundary harness (`pnpm boundaries`) enforces this.

## Rules specific to this module

- **Never re-implement the score weights.** They live in `@nid/core` (`HEALTH_EVENT_WEIGHTS`). This module appends `HealthEvent`s and calls `computeHealthScore` / `bandFromScore`. If a weight feels wrong, change it in core, not here.
- **The score is derived, not stored.** Persist *events*, recompute on read. Do not cache a numeric score in the store — that invites drift between the score and its evidence.
- **A decision must emit its event in the same action.** `decideRedressal` sets the case status AND appends the matching health event atomically (read/write-by-default audit discipline). Don't split them.
- **Parse every decision input through its Zod schema** (`redressalDecisionSchema`, `blacklistAddSchema`, etc.) at the action boundary.
- **Redressal severity asymmetry:** internships get the stricter treatment (Phase 5.7). The `isInternship` flag is carried for the UI to surface; respect it when adding timeline logic later.
- **exactOptionalPropertyTypes is on** — optional fields are `field?: T`; spread conditionally. Extends `tsconfig.node.json` (uses `node:fs`). Relative imports omit `.js`.

## Before marking work done

- This module ships all **5 markdown contracts** — `pnpm check:contracts` fails otherwise.
- `pnpm --filter @nid/module-admin-accountability typecheck` + `pnpm -r typecheck` clean.
- `pnpm boundaries` clean (no cross-module imports, no cycle).
- Boot `:3100`; walk `/admin/health-scores → [recruiter] → /admin/redressal → decide a case → confirm the recruiter's score drops`. Then `/admin/blacklist`, `/admin/payment-cell`.
