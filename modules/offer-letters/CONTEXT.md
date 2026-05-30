# CONTEXT.md — domain knowledge for modules/offer-letters

> What to *know* before working here: decisions already made, the data shapes, and the gotchas. Round 4 §D is the source of truth.

## Why this module exists (the "mock-real" decision)

NID recruiters write offer letters on their own letterhead in their own systems. The
portal does not generate the letter — it **receives** the recruiter's real PDF and
**vouches for it** with an institute certificate of authenticity. That certificate is
what makes a pasted/forwarded PDF trustworthy: a SHA-256 hash bound to the offer's
identifying facts + a public `/verify/<hash>` page anyone (student, parent, auditor)
can open with no login. This is the placement system's stand-in for a notarized seal.

## The two shapes (plan §D)

- `OfferLetter { id, jdId, studentId, wave, fileName, pdfBase64, pdfChecksum, certificate, version, uploadedAt, updatedAt? }`
- `OfferCertificate { certificateId, hash, qrDataUrl, verifyPath, issuedAt, instituteApproved: true }`
  - `hash` = SHA-256 over `jdId|studentId|wave|ctc|stipend|issuedAt|pdfChecksum`.
  - `instituteApproved` is the literal `true` (the institute stamps every upload in the prototype).
- `CertificateView` = the **redacted** projection returned by `verifyCertificate(hash)`. Same identity fields + `pdfChecksum`, but **no `pdfBase64`**.

## Decisions already made — do not relitigate

- **QR = PATH B (placeholder), not PATH A.** A285 ships the zero-dependency QR-styled SVG: the module grid is derived from the hash, drawn with three finder eyes so it *reads* as a QR, wrapped as a `data:image/svg+xml;utf8,...` data-URL. It is **not scannable**; the plain `verifyPath` text alongside it is the real channel. No `qrcode`/`qr-encode` dependency is added.
- **Base64 cap = 2,800,000 bytes.** Bigger letters are rejected. Keeps the base64 blob + the best-effort durable-KV mirror practical and keeps this store off the hot cascade store.
- **Separate store from offer-cascade.** Letters carry a multi-MB blob; isolating them keeps the cascade store (read on every offers-page render) small.
- **One letter per (jdId, studentId).** The store keys by `oletter_<jdId>_<studentId>`. Re-pushing the same pair version-bumps in place (not a new row), and the old certificate hash is retired from `byHash`.
- **No demo seed.** A real letter needs a real uploaded PDF; a fabricated base64 blob would mint a certificate over garbage. The store starts empty.

## Gotchas

- **Omit ≠ zero in the hash.** `ctcPaise`/`stipendPaise` are optional; when absent they serialize to `''`, when `0` they serialize to `'0'`. These produce different hashes by design — the certificate binds whatever figure (or absence) was supplied.
- **Base64 validation.** `decodeBase64` re-encodes and compares to reject garbage; the action also checks the decoded blob starts with the `%PDF` magic and re-checks the true byte length against the cap (the schema bound is the *caller-reported* size).
- **`data:` URL escaping.** The SVG data-URL escapes `%`, `#`, `"`, `<`, `>`, `&` (in that order — `%` first) so it is safe in both an `<img src>` and a CSS context. Do not change the order.
- **Hash collisions on re-push at the same instant.** If the *same bytes* are re-pushed (identical `pdfChecksum`, `issuedAt`, etc.) the hash is unchanged; `byHash` simply re-points to the same id and the version still bumps. That is acceptable — verification still resolves.
- **Account-lock / ownership are NOT here.** Enforced in the calling web server action. This module assumes authorized input.

Read [[REFERENCES.md]] next.
