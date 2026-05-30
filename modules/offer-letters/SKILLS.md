# SKILLS.md — how to move fast in modules/offer-letters

> Skills + fetchable source pointers so any LLM (Claude, GPT, Gemini, local) can resolve the techniques this module relies on. Keep these handy when editing; they are the fast-path for the recurring tasks here.

## Techniques this module uses

| Technique | Where it lives here | Reference to resolve |
|---|---|---|
| Content hashing for tamper-evidence | `src/certificate.ts` `computeOfferHash` / `sha256Hex` | Node `crypto.createHash('sha256')` — https://nodejs.org/api/crypto.html#cryptocreatehashalgorithm-options |
| Deterministic placeholder QR as inline SVG | `src/certificate.ts` `buildQrDataUrl` | SVG `data:` URLs — https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs ; QR finder-pattern look — https://en.wikipedia.org/wiki/QR_code#Design |
| Base64 decode + validation + magic-byte sniff | `src/actions.ts` `decodeBase64` + `%PDF` check | Node `Buffer.from(str,'base64')` — https://nodejs.org/api/buffer.html#static-method-bufferfromstring-encoding ; PDF header — https://en.wikipedia.org/wiki/PDF#File_format |
| Boundary validation | `src/types.ts` `uploadLetterSchema` | Zod — https://zod.dev |
| JSON store with durable mirror | `src/store.ts` (mirror of offer-cascade) | Pattern source: `modules/offer-cascade/src/store.ts` (in-repo) |
| `exactOptionalPropertyTypes` conditional spread | every optional field across `src/*` | TS docs — https://www.typescriptlang.org/tsconfig#exactOptionalPropertyTypes |

## Project skills registry (resolvable)

The repo's skill sources live under the root [[../../SKILLS.md]]. The ones most relevant
to this module are the **strict-TS** and **Zod-boundary** skills; load those when adding
fields or actions. For the hashing/QR work, the Node `crypto` + SVG `data:` URL docs
above are sufficient and no extra skill is required.

## Fast-path recipes

- **Add a field to the certificate hash:** edit `OfferHashParts` + the `canonical` array in `computeOfferHash` (append, do not reorder), thread it through `pushOfferLetter`, and add a hash-stability + change-on-mutation test. Re-pushing must produce a new hash and retire the old one in `byHash`.
- **Expose a new field on `/verify`:** add it to `CertificateView` and the `verifyCertificate` projection — and assert in a test that it is not (and cannot reach) `pdfBase64`.
- **Change the size cap:** edit `MAX_LETTER_BYTES` only; the schema bound and the action's decoded-length re-check both read it.

This is the last of the 5 module markdowns. Return to [[CLAUDE.md]] for the map.
