# modules/offer-cascade — Module Entry Point

> Scoped to wave-based offer issuance (Phase 4.8). Root context: [[../../CLAUDE.md]].

## What this module owns

```
/recruiter/jds/<jdId>/offers
  Wave 1: float N offers (N = open positions) to the top-N shortlisted students
        │
        ▼  students respond: accept / decline  (status tracked live)
        │
        ▼  on decline/expire → a position reopens
        │
  Float next wave → offer to the next-ranked shortlisted students
        │
        ▼  loop until positions filled OR shortlist exhausted
```

**Hard cap (Phase 4.8 / 5.4): `outstanding + accepted <= positions`. No buffer.**
The cascade enforcement lives in `@nid/core` (`describeCascade`, `canIssueOffers`); this module persists offers + responses and calls those pure functions to gate every issuance.

## What this module does NOT own

- The cascade *math* — that's `@nid/core/rules/offer-cascade`. This module is persistence + wiring.
- Student-side accept/decline UI (student portal, later). For the demo, the offers page exposes a clearly-labeled "student response (demo)" control to exercise the cascade.
- Offer-letter generation (recruiter supplies their own letter later).

## Where things live

| File | Purpose |
|---|---|
| `src/index.ts` | Public API. |
| `src/types.ts` | OfferRecord, Zod schemas. |
| `src/store.ts` | JSON-backed offers store. |
| `src/actions.ts` | issueOffer / recordResponse / listOffers / cascadeFor (wraps @nid/core). |

Read [[AGENTS.md]], [[CONTEXT.md]], [[REFERENCES.md]], [[SKILLS.md]] next.
