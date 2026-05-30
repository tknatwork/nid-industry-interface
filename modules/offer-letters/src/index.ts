// @nid/module-offer-letters — public API (Round 4 §D).
//
// Mock-real offer letters: recruiter uploads a real PDF, an institute certificate
// of authenticity (SHA-256 + dependency-free QR-styled SVG + public /verify/<hash>)
// is auto-attached. `verifyCertificate` returns a redacted view (never base64).

export { pushOfferLetter, getOfferLetter, listLettersForJd, verifyCertificate } from './actions';
export {
  computeOfferHash,
  sha256Hex,
  buildCertificate,
  buildQrDataUrl,
  verifyPathForHash,
  type OfferHashParts,
} from './certificate';
export {
  MAX_LETTER_BYTES,
  uploadLetterSchema,
  type OfferLetter,
  type OfferCertificate,
  type CertificateView,
  type UploadLetterInput,
  type PushResult,
} from './types';
