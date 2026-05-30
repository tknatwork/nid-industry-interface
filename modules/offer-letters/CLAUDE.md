# modules/offer-letters — Module Entry Point

> Scoped to mock-real offer letters + the institute certificate of authenticity (Round 4 §D). Root context: [[../../CLAUDE.md]]. Load this plus the other four module markdowns when working here; do not pull root markdowns beyond the root entry point unless the work is cross-module.

## What this module owns

```
recruiter uploads a REAL offer PDF (base64, ≤ 2.8 MB)
        │
        ▼  pushOfferLetter: validate → decode → pdfChecksum = sha256Hex(bytes)
        │
        ▼  certificate hash = sha256(jdId|studentId|wave|ctc|stipend|issuedAt|pdfChecksum)
        │
        ▼  institute certificate auto-attached (instituteApproved: true)
        │       • dependency-free QR-styled SVG data-URL (PATH B placeholder)
        │       • plain `/verify/<hash>` path (the real verification channel)
        │
        ▼  re-push for same (jdId, studentId) → version-bump, old hash retired
        │
  public /verify/<hash> → verifyCertificate(hash) → REDACTED view (never base64)
```

The module is **persistence + certificate minting**. It does NOT decide *who* gets an
offer (that is offer-cascade + the After-tally selection), and it does NOT send the
notification email/SMS (that is recruiter-onboarding's `queueOfferLetterNotice`).

## What this module does NOT own

- The cascade math / sequence / deadlines — that is `@nid/core` + `modules/offer-cascade`.
- Real PDF rendering or a scannable QR code. The PDF is supplied by the recruiter; the
  QR glyph is a deterministic placeholder. The certificate's authority is the SHA-256
  hash + the public `/verify/<hash>` page, never the QR pixels.
- Delivery (email/SMS Outbox) — `modules/recruiter-onboarding.queueOfferLetterNotice`.
- The student-side PDF viewer and the public `/verify/<hash>` page — those are in `apps/web`.

## Where things live

| File | Purpose |
|---|---|
| `src/index.ts` | Public API. Cross-module imports must go through here. |
| `src/types.ts` | `OfferLetter`, `OfferCertificate`, `CertificateView`, Zod `uploadLetterSchema`, `MAX_LETTER_BYTES`. |
| `src/certificate.ts` | `node:crypto` SHA-256: `computeOfferHash`, `sha256Hex`, `buildCertificate`, QR-styled SVG data-URL. |
| `src/store.ts` | JSON-backed store: `{ letters, byHash, counter }`, `loadState`/`persist`+`syncKv('offer-letters', …)`. |
| `src/actions.ts` | `pushOfferLetter` / `getOfferLetter` / `listLettersForJd` / `verifyCertificate`. |
| `test/*.test.ts` | Hash stability + version-bump + redaction (no base64 in the verify view). |

Read [[AGENTS.md]] next.
