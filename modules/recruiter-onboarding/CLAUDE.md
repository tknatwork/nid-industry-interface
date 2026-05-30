# modules/recruiter-onboarding — Module Entry Point

> Scoped to the recruiter onboarding concern: the pre-login application, the public ticket tracker, and the status state machine. Load this file plus the other four module markdowns when working in this directory. Do not pull root-level markdowns beyond [[../../CLAUDE.md]] unless cross-module work is required.

## What this module owns

The pre-login recruiter onboarding flow per Phase 4.1 of the plan:

```
Discovery ──► /apply  (form, no login)
              │
              ▼
       Ticket issued ──► email + SMS (mock previews in dev)
              │
              ▼
       /track/<ticket> reflects the state machine:
         application-received → verification-pending → fee-due
         → payment-received → approved → credentials-issued
```

The module exposes (public API in `src/index.ts`):

- A typed **submit** server-side action (validates + creates a ticket).
- A typed **lookup** (ticket status) reader, backed by `getTicketStatus`.
- A typed **advance** admin transition (backed by `advanceTicketStatus`), used by `/admin/recruiters/queue`.
- A typed **pay** action (mock participation-fee payment) that advances `fee-due → payment-received` and generates a `PaymentReceipt` mapped to the ticket.
- An in-memory mock store backed by a JSON file for dev so demo tickets survive restarts.
- Status-history + comms-outbox (email + SMS) rendering helpers consumed by `/track/<ticket>`.

> Vocabulary note: the onboarding domain calls the tracked artifact a **ticket** (`ApplicationTicketRecord`, `ticketId`, `formatTicketId`/`parseTicketId`). This is distinct from design tokens, API keys, and auth/session tokens, which keep the word "token".

## What this module does NOT own

- Login + session establishment after credentials issue (that's a separate auth module).
- Real payment gateway / PFMS settlement (the `pay` action is a mock; it only records that the ticket transitioned to `payment-received` and mints a demo receipt).
- JD posting, candidate browse, slot booking — separate modules.
- Real DB writes. This is Milestone 2 mock-data scope. The DB-backed implementation lands later by swapping the adapter behind the same module API.

## Where things live

| File | Purpose |
|---|---|
| `src/index.ts` | Public module API. Cross-module imports must go through here. |
| `src/types.ts` | Zod schemas + module-local types. |
| `src/store.ts` | Mock ticket store (in-memory + JSON file for dev). |
| `src/actions.ts` | Use cases: submit, lookup, advance, pay. |
| `src/tokens.ts` | Ticket ID generation in the NID-YYYY-X-NNNN format (`formatTicketId`/`parseTicketId`). |

Read [[AGENTS.md]] next.
