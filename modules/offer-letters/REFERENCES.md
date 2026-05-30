# REFERENCES.md — where to look, for modules/offer-letters

> Pointers to the plan, the shapes, the sibling modules, and the web surfaces that consume this module. Read these instead of re-deriving context.

## Authoritative plan

- `/Users/tusharkant/.claude/plans/this-is-a-demo-wiggly-parrot.md`
  - **§D — Offers flow → "offer-letters (NEW module)"** (~line 3518): the `OfferLetter` / `OfferCertificate` shapes, the SHA-256 field list, the QR PATH A/B decision, the 2.8 MB cap, the `pushOfferLetter` / `getOfferLetter` / `verifyCertificate` contract.
  - **§D — "Delivery"** (~line 3519): `queueOfferLetterNotice` belongs to recruiter-onboarding, not here.
  - **§D — "Public verify" / "Student side"** (~line 3520): `apps/web/app/verify/[hash]/page.tsx` and the student `View letter` viewer.
  - **Wave 2 verifier "certificate"** (~line 3544): hash stable per input, changes on a new PDF, verify exposes no base64 — these are the adversarial checks this module must pass.

## Sibling modules to mirror / call

| Need | Look at |
|---|---|
| Store pattern (`loadState`/`persist`+`syncKv`, `/tmp` vs `.dev-data`) | `modules/offer-cascade/src/store.ts` (mirrored exactly, minus the seed) |
| package.json / tsconfig shape | `modules/offer-cascade/{package.json,tsconfig.json}` |
| Receipt + hash + email/SMS Outbox pair (the delivery pattern this feeds) | `modules/recruiter-onboarding/src/store.ts` (`payTicketFee` → receipt + Outbox) |
| vitest pin + `test/` dir convention | `modules/jd-posting/package.json` (`vitest 2.1.8`, `vitest run`) + `modules/jd-posting/test/` |

## External / shared

- `@nid/db` → `syncKv(name, state)` — durable write-through, no-op without `DATABASE_URL`.
- `@nid/core` → `Offer.{sequenceIndex?,deadlineIso?}` and the cascade rules (this module does not import them, but the offers UI does; the certificate binds the same `ctc`/`stipend` figures).
- `node:crypto` → `createHash('sha256')` — the only crypto primitive used.

## Consumers (apps/web — outside this module)

- `apps/web/app/recruiter/offers/...` server action calls `pushOfferLetter` (after `requireOwnedJd` + account-lock), then `recruiter-onboarding.queueOfferLetterNotice`.
- `apps/web/app/verify/[hash]/page.tsx` (public RSC) calls `verifyCertificate(hash)`.
- `apps/web/app/student/offers/page.tsx` reads `getOfferLetter` to build the blob-URL viewer + certificate badge.

Read [[SKILLS.md]] next.
