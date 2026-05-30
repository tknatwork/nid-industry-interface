# AGENTS.md — work protocol for modules/offer-letters

> What to do *before* touching files in this module. This is the rule-set for every change here, scoped tighter than the root [[../../AGENTS.md]].

## Before you change anything

1. Read this module's [[CLAUDE.md]], [[CONTEXT.md]], [[REFERENCES.md]], [[SKILLS.md]] — not the root markdowns (keep prompt context light).
2. Confirm the change belongs here: this module is **persistence + certificate minting** only. Cascade math, sequence/deadlines, delivery (email/SMS), the verify page UI, and the student PDF viewer all live elsewhere (see [[CONTEXT.md]]).

## Hard rules (do not regress)

- **No new runtime dependencies.** The QR is a dependency-free SVG (PATH B). Adding a QR library is forbidden — the plan deliberately chose the zero-dep placeholder + the `/verify/<hash>` page as the authority.
- **`verifyCertificate` is redacted.** It must NEVER return `pdfBase64`. It returns a `CertificateView`. If you add a field to the view, prove it is not the blob.
- **TypeScript strict + `exactOptionalPropertyTypes`.** Omit absent optional props via conditional spread `...(v !== undefined ? { k: v } : {})`. Never write `k: undefined`. No `any`, no unsafe casts without `// SAFE-CAST: <reason>`.
- **Zod at the boundary.** Every external input goes through `uploadLetterSchema` (and re-checks the decoded byte length against `MAX_LETTER_BYTES` in the action). Wrap any `JSON.parse` in a schema.
- **Hash determinism is a contract.** `computeOfferHash` must stay stable for identical inputs and change when any part — especially `pdfChecksum` — changes. The serialization order `jdId|studentId|wave|ctc|stipend|issuedAt|pdfChecksum` is load-bearing; do not reorder. Optional money fields normalize to `''` when absent (so omit ≠ zero).
- **Store shape is `{ letters, byHash, counter }`.** Mirror offer-cascade's `loadState`/`persist(state)`+`syncKv('offer-letters', state)` pattern and the `/tmp`-on-`VERCEL` vs `.dev-data` path switch. On re-push, retire the old hash from `byHash` so a superseded `/verify/<oldHash>` stops resolving.
- **Ownership is enforced by the caller.** This module trusts already-authorized input (mirrors offer-cascade/interview-console). The web server action does `requireOwnedJd` + account-lock; do not duplicate or weaken that here.

## What "done" looks like

- Tests written/updated alongside the change (`pnpm -C modules/offer-letters test`).
- `pnpm -r typecheck` clean; `pnpm boundaries` clean (no cross-module imports outside `@nid/core`/`@nid/db`); `pnpm check:contracts` green (all 5 markdowns present + non-stub).
- No base64 leaks into any redacted/public path.

Read [[CONTEXT.md]] next.
