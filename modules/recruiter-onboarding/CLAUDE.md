# modules/recruiter-onboarding — Module Entry Point

> Scoped to the recruiter onboarding concern: the pre-login application, the public ticket tracker, and the status state machine. Load this file plus the other four module markdowns when working in this directory. Do not pull root-level markdowns beyond [[../../CLAUDE.md]] unless cross-module work is required.

## What this module owns

The pre-login recruiter onboarding flow per Phase 4.1 of the plan:

```
Discovery ──► /apply  (form, no login)
              │
              ▼
       Token issued ──► email + SMS (mock previews in dev)
              │
              ▼
       /track/<token> reflects the state machine:
         application-received → verification-pending → fee-due
         → payment-received → approved → credentials-issued
```

The module exposes:

- A typed **submitApplication** server-side action.
- A typed **getTokenStatus** lookup.
- A typed **advanceTokenStatus** admin transition (used later by `/admin/recruiters/queue`).
- An in-memory mock store backed by a JSON file for dev so demo tokens survive restarts.
- Status-history rendering helpers consumed by `/track/<token>`.

## What this module does NOT own

- Login + session establishment after credentials issue (that's a separate auth module).
- Payment gateway integration (it only knows the token transitions to `payment-received` when notified).
- JD posting, candidate browse, slot booking — separate modules.
- Real DB writes. This is Milestone 2 mock-data scope. The DB-backed implementation lands later by swapping the adapter behind the same module API.

## Where things live

| File | Purpose |
|---|---|
| `src/index.ts` | Public module API. Cross-module imports must go through here. |
| `src/types.ts` | Zod schemas + module-local types. |
| `src/store.ts` | Mock token store (in-memory + JSON file for dev). |
| `src/actions.ts` | Use cases: submitApplication, getTokenStatus, advanceTokenStatus. |
| `src/tokens.ts` | Token ID generation in the NID-YYYY-X-NNNN format. |

Read [[AGENTS.md]] next.
