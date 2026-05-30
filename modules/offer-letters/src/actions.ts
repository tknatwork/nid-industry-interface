import {
  MAX_LETTER_BYTES,
  PDF_MAGIC,
  uploadLetterSchema,
  type CertificateView,
  type OfferLetter,
  type PushResult,
} from './types';
import { buildCertificate, sha256Hex, type OfferHashParts } from './certificate';
import { findLetter, lettersForJd, letterByHash, upsertLetter } from './store';

/**
 * Decode a base64 string to bytes. Returns `null` when the input is not valid
 * base64 (round-trips back to a different string), so a corrupt upload can be
 * rejected rather than silently checksummed.
 */
function decodeBase64(b64: string): Buffer | null {
  const cleaned = b64.replace(/\s+/g, '');
  const buf = Buffer.from(cleaned, 'base64');
  if (buf.length === 0) return null;
  // Buffer.from is lenient; verify the re-encode matches to catch garbage input.
  if (buf.toString('base64').replace(/=+$/, '') !== cleaned.replace(/=+$/, '')) {
    return null;
  }
  return buf;
}

/**
 * Push (upload) an offer letter: validate → decode base64 → compute the PDF
 * checksum → derive the certificate hash → mint an institute certificate
 * (`instituteApproved: true`) → upsert (version-bump on re-push for the same
 * jdId+studentId). Ownership/account-lock are enforced by the *calling* web
 * server action (this module takes already-authorized input, mirroring the
 * other persistence modules).
 */
export function pushOfferLetter(input: unknown): PushResult {
  const parsed = uploadLetterSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, reason: parsed.error.issues[0]?.message ?? 'Invalid upload' };
  }
  const { jdId, studentId, wave, fileName, pdfBase64, ctcPaise, stipendPaise, issuedAt } =
    parsed.data;

  const bytes = decodeBase64(pdfBase64);
  if (!bytes) return { ok: false, reason: 'Could not decode the uploaded file (invalid base64).' };

  // Defense in depth: re-check the *true* decoded size against the cap, even
  // though the schema already bounded the caller-reported sizeBytes.
  if (bytes.length > MAX_LETTER_BYTES) {
    return { ok: false, reason: `File exceeds the ${(MAX_LETTER_BYTES / 1_000_000).toFixed(1)} MB limit.` };
  }
  if (bytes.subarray(0, PDF_MAGIC.length).toString('latin1') !== PDF_MAGIC) {
    return { ok: false, reason: 'The uploaded file does not look like a PDF.' };
  }

  const pdfChecksum = sha256Hex(bytes);
  const mintedAt = issuedAt ?? new Date().toISOString();

  const hashParts: OfferHashParts = {
    jdId,
    studentId,
    wave,
    issuedAt: mintedAt,
    pdfChecksum,
    ...(ctcPaise !== undefined ? { ctcPaise } : {}),
    ...(stipendPaise !== undefined ? { stipendPaise } : {}),
  };

  const certificate = buildCertificate(`cert_${jdId}_${studentId}`, hashParts, mintedAt);

  const letter = upsertLetter({
    jdId,
    studentId,
    wave,
    fileName,
    pdfBase64: pdfBase64.replace(/\s+/g, ''),
    pdfChecksum,
    certificate,
    uploadedAt: mintedAt,
  });

  return { ok: true, letter };
}

/** Fetch the full stored letter (incl. base64) for a (jdId, studentId). */
export function getOfferLetter(jdId: string, studentId: string): OfferLetter | null {
  return findLetter(jdId, studentId);
}

/** All letters floated for a JD (sorted by wave, then upload time). */
export function listLettersForJd(jdId: string): readonly OfferLetter[] {
  return lettersForJd(jdId);
}

/**
 * Public verification for `/verify/<hash>`. Returns a REDACTED view — proves
 * authenticity + which offer it binds, but NEVER the base64 PDF. `null` when
 * the hash is unknown or has been superseded by a re-push.
 */
export function verifyCertificate(hash: string): CertificateView | null {
  const letter = letterByHash(hash);
  if (!letter) return null;
  return {
    certificateId: letter.certificate.certificateId,
    hash: letter.certificate.hash,
    verifyPath: letter.certificate.verifyPath,
    qrDataUrl: letter.certificate.qrDataUrl,
    issuedAt: letter.certificate.issuedAt,
    instituteApproved: letter.certificate.instituteApproved,
    jdId: letter.jdId,
    studentId: letter.studentId,
    wave: letter.wave,
    fileName: letter.fileName,
    version: letter.version,
    pdfChecksum: letter.pdfChecksum,
  };
}
