# CONTEXT.md — recruiter-onboarding module knowledge

> Domain knowledge specific to this module. Read after [[AGENTS.md]].

## Why this module exists separately from the rest

The recruiter onboarding flow has a unique property: **it runs without authentication.** Every other recruiter surface lives behind a login. This module owns the public surface area where the recruiter has only a token and no portal account yet. That asymmetry is the reason we isolate it — its security posture, its data model, and its UX patterns differ from authenticated flows.

## State machine

The token moves through a strict state machine. Each transition is recorded in `statusHistory` with a timestamp and an optional note.

| Status | Who can move it forward | Next state(s) | Recruiter sees | Email/SMS sent |
|---|---|---|---|---|
| `application-received` | System (auto on form submit) | `verification-pending`, `rejected` | "Received — pending verification" | Confirmation email + SMS with token URL |
| `verification-pending` | Admin (after vetting company + GST + corporate email) | `fee-due`, `rejected` | "Verified — payment due (₹X)" | Verification-complete email |
| `fee-due` | System (on payment gateway callback) | `payment-received` | "Awaiting payment confirmation" | (no event email; payment flow handles its own receipts) |
| `payment-received` | Admin (after final approval review) | `approved` | "Payment received — under final approval" | (none) |
| `approved` | System (auto on admin approval) | `credentials-issued` | "Approved — credentials pending" | Approval email |
| `credentials-issued` | System (auto after credentials minted) | (terminal) | "Approved — credentials emailed. Log in →" | Credentials email |
| `rejected` | Admin (terminal) | (terminal) | Rejection reason + appeal CTA | Rejection email |

## Why we use a JSON-backed mock store in Milestone 2

The plan's Phase 5 build sequence puts mock data first, then DB persistence later. We want:

1. The module API (`submitApplication`, `getTokenStatus`, `advanceTokenStatus`) to be the contract the web layer consumes.
2. The implementation behind that contract to be swappable from "mock JSON" → "Drizzle Postgres" with zero changes to callers.
3. Demo tokens to survive `next dev` restarts so the tracker isn't empty between sessions.

Pattern: the public API in `src/index.ts` calls into `src/store.ts`, which reads/writes `.dev-data/recruiter-onboarding.json` at the project root. In Milestone 3 or 4, we'll add a Drizzle-backed implementation behind the same module API. The web layer never knows the difference.

## Token format

`NID-YYYY-CC-NNNN`:

- `YYYY` is the cycle's calendar year (currently `2026`).
- `CC` is the single-letter cycle code: `A` for the spring window, `B` for the autumn window.
- `NNNN` is a 4-digit counter that resets per cycle.

Examples:
- `NID-2026-A-0001` — first applicant of Spring 2026
- `NID-2026-A-0142` — 142nd applicant of Spring 2026
- `NID-2026-B-0001` — first applicant of Autumn 2026

The token is shareable, copy-friendly, and revealable in URL form: `/track/NID-2026-A-0142`. The recruiter can revisit it forever — it never expires, even after credentials are issued.

## Mock email + SMS in Milestone 2

We capture every status transition as an outbox entry in the mock store. The future admin queue surface will render the outbox so we can audit "what comm went where" without actually sending. When the real `CommsProvider` adapter lands, we replace the outbox-write with a real send.

## Out-of-scope for this module

- Login after `credentials-issued`. Auth lives in its own module.
- Mid-cycle status changes by the admin (e.g. moving from `approved` back to `verification-pending` because of a discovered issue). Admin override is in the admin module.
- Multi-cycle history per recruiter. Each application is per-cycle; lifetime view aggregates across application tokens via the Recruiter entity in `@nid/core`.

Read [[REFERENCES.md]] next.
