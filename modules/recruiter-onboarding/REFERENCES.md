# REFERENCES.md — recruiter-onboarding pointers

## Plan sections most relevant to this module

- Phase 4.1 (the canonical flow this module implements)
- Phase 1.5 "On the entry sequence" (rationale for token-first instead of login-first)
- Phase 3.2 (the public sitemap that `/apply` and `/track/<token>` live in)
- Phase 6.1 (compliance posture — DPDP, audit-log retention)

## Entities consumed from `@nid/core`

- `Recruiter` — populated only after admin approval
- `ApplicationToken` — the central entity this module owns
- `RecruiterStatus` enum
- `CycleId`

## Sibling modules that interact with us (future milestones)

- `admin-recruiter-queue` — consumes `advanceTokenStatus` to vet applications
- `auth` — consumes `credentials-issued` event to mint login credentials
- `payment-cell` — feeds payment receipts back as `payment-received` transitions

## External references

- W3C ARIA Authoring Practices Guide — used for the status-timeline component pattern in the tracker UI: <https://www.w3.org/WAI/ARIA/apg/>

## File map (within this module)

- `src/index.ts` — public API
- `src/types.ts` — Zod schemas
- `src/store.ts` — JSON-backed mock store
- `src/tokens.ts` — token ID generator
- `src/actions.ts` — use cases
- `.dev-data/recruiter-onboarding.json` (gitignored, created on first write)

Read [[SKILLS.md]] next.
