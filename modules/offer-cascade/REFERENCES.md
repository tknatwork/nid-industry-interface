# REFERENCES.md — offer-cascade pointers

## Plan sections
- Phase 4.8 (wave-based offer cascade, strict 1:1 to positions)
- Phase 5.4 (cascade enforcement — hard cap, no buffer)

## @nid/core (the cascade math — do not reimplement)
- `describeCascade(offers, positions, shortlistRemaining)`
- `canIssueOffers(state, additionalOffers)`
- `Offer`, `OfferStatus` (entity types)

## Sibling modules
- `candidate-browse` — supplies the shortlist (offer candidates come from it)
- `jd-posting` — supplies positions + compensation
- student portal (later) — replaces the demo response control with real accept/decline

## File map
- `src/index.ts` / `src/types.ts` / `src/store.ts` (`.dev-data/offer-cascade.json`) / `src/actions.ts`

NOTE: mock data at `apps/web/.dev-data/` under `pnpm --filter web dev`.
