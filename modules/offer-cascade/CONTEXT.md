# CONTEXT.md — offer-cascade module knowledge

> Read after [[AGENTS.md]].

## Why wave-based, strict 1:1

Per Phase 4.8 (a user-confirmed correction to an earlier buffer model): if a JD has 3 positions, the recruiter floats exactly 3 offers. Outstanding + accepted never exceeds the position count. When a student declines, a position reopens and the recruiter floats the next wave to the next-ranked shortlisted student. This prevents over-offering (which would let a company collect more acceptances than it has seats, harming students who turned down other offers).

## The @nid/core contract this module wires

- `describeCascade(offers, positions, shortlistRemaining) → { canFloatNextWave, availableSlots, nextWaveSize, reasonIfBlocked? }`
- `canIssueOffers(state, additionalOffers) → { allowed, reason? }` where state = `{ positions, outstanding, accepted, declinedOrExpired, shortlistRemaining }`

This module computes the state from its persisted offers + the caller-supplied shortlist size, then calls these.

## Entities

`OfferRecord`: `{ id, jdId, studentId, wave, status, ctcPaise?, stipendPaise?, issuedAt, respondedAt?, responseReason? }`.
`status` ∈ `pending | accepted | declined | expired`.

## Offer compensation

Pulled from the JD at issue time (full-time → CTC midpoint or min; internship → stipend). For the demo we store the JD's `baseMinPaise` (or `stipendPaise`) on the offer.

## Demo response control

The student accept/decline is normally a student-portal action. Until that lands, the offers page exposes a "student response (demo)" control per pending offer so the cascade is exercisable. It's clearly labeled DEMO.

Read [[REFERENCES.md]], [[SKILLS.md]] next.
