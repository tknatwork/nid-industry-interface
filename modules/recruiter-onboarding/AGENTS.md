# AGENTS.md — Module work protocol (recruiter-onboarding)

## Before changing anything in this module

1. Confirm the root-level rule still applies: no cross-module internal imports. Anyone importing from this module imports from `@nid/module-recruiter-onboarding` (i.e. our `src/index.ts`), never `src/store.ts` directly.
2. Read [[CONTEXT.md]] for the status state machine rules.
3. Update [[../../../.gcc/session-memory.md]] if your work changes the module's next step.

## When changing the state machine

- Every status transition is unidirectional **except** `application-received → rejected` and `verification-pending → rejected`. Once we move past `payment-received` there is no rejection state — withdrawal goes through the JD-withdrawal flow (a different module).
- Every transition emits an `audit_log` entry. In Milestone 2 mock-data scope, we still emit the entry (to an in-memory queue) so the downstream admin queue surface can consume it later without a refactor.
- Mutations must validate the input with the Zod schemas declared in `src/types.ts`. No raw cast from `unknown`.

## When changing the token ID format

- The format is `NID-YYYY-CC-NNNN`:
  - `YYYY` = cycle year
  - `CC` = single uppercase letter for the cycle code (`A` = first window of the year, `B` = second)
  - `NNNN` = 4-digit zero-padded counter per cycle
- Changing this format requires a migration plan for any in-flight tokens. Do not change in Milestone 2.

## When adding new status reasons

Status reasons are documented strings, not enums, so admin can write a custom rejection reason. The state itself (the enum value) is the gate — the reason is the human note. Adding a new state requires updating `src/types.ts`, the tracker UI in `apps/web/app/track/[token]`, and the admin queue (when that lands in Milestone 3).

## When testing

- Unit tests live in `src/__tests__/`.
- Test the pure-function transitions in `src/store.ts` first. They are the load-bearing business logic.
- Integration tests use the JSON-file-backed store with a temp dir; no real DB required.

Read [[CONTEXT.md]] next.
