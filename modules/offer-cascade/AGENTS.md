# AGENTS.md — Module work protocol (offer-cascade)

## Rules

1. No cross-module internal imports; consumers use `@nid/module-offer-cascade`.
2. **Every issuance is gated by `@nid/core`'s `canIssueOffers`.** Do not persist a new offer without first checking the cap (`outstanding + accepted <= positions`). No buffer escape valve — this is the Phase 4.8 guardrail.
3. **Do not re-offer a student who already declined this JD.** A declined offer is terminal for that (jd, student) pair.
4. The cascade math is in `@nid/core/rules/offer-cascade` — do NOT reimplement it here. Call `describeCascade` + `canIssueOffers`.
5. Zod-validate inputs; no raw casts.

## Wave semantics

- A "wave" is a batch of offers issued together. `wave` increments per batch.
- Issuing is allowed only up to `availableSlots = positions - (outstanding + accepted)`.
- On decline/expire, a slot reopens and the next wave can float.

## Testing priority

The cap enforcement (can't exceed positions) + no-re-offer-after-decline are the load-bearing invariants. The @nid/core functions are already unit-verified; test the persistence wiring around them.
