import { z } from 'zod';

/**
 * Round 4 §D — mock-real offer letters + institute certificate of authenticity.
 *
 * The recruiter uploads a *real* PDF (base64, capped at ~2.8 MB). The institute
 * auto-attaches an {@link OfferCertificate}: a SHA-256 hash over the offer's
 * identifying fields + the PDF checksum, a dependency-free QR-styled SVG data-URL
 * derived from that hash, a public `/verify/<hash>` path, a timestamp, and an
 * `instituteApproved: true` stamp. The certificate's authority is the hash + the
 * public verify page, never the QR pixels (which are a deterministic placeholder).
 */
export interface OfferCertificate {
  /** Stable id for this certificate (mirrors the offer-letter id, prefixed). */
  readonly certificateId: string;
  /**
   * SHA-256 hex over `jdId|studentId|wave|ctc|stipend|issuedAt|pdfChecksum`.
   * Stable for identical inputs; changes if any part (incl. the PDF) changes.
   */
  readonly hash: string;
  /**
   * A QR-styled SVG whose module grid is derived deterministically from {@link hash},
   * wrapped as a `data:image/svg+xml;utf8,...` data-URL. PATH B: a placeholder, not
   * a scannable QR — no QR dependency is used. The plain {@link verifyPath} is the
   * real verification channel and is always shown alongside it.
   */
  readonly qrDataUrl: string;
  /** Public, session-less verification path, e.g. `/verify/<hash>`. Plain text. */
  readonly verifyPath: string;
  /** ISO timestamp the certificate was minted. */
  readonly issuedAt: string;
  /** Always true for the prototype — the institute stamps every uploaded letter. */
  readonly instituteApproved: true;
}

/**
 * A persisted offer letter. The `pdfBase64` blob is the recruiter's real upload;
 * it is NEVER exposed by {@link OfferCertificate} verification (redacted view only).
 */
export interface OfferLetter {
  readonly id: string;
  readonly jdId: string;
  readonly studentId: string;
  readonly wave: number;
  readonly fileName: string;
  /** Base64-encoded PDF bytes (no data-URL prefix). Capped via uploadLetterSchema. */
  readonly pdfBase64: string;
  /** SHA-256 hex of the decoded PDF bytes — feeds the certificate hash. */
  readonly pdfChecksum: string;
  readonly certificate: OfferCertificate;
  /** Bumped each time the same (jdId, studentId) letter is re-pushed. */
  readonly version: number;
  readonly uploadedAt: string;
  readonly updatedAt?: string;
}

/**
 * Redacted certificate view returned by `verifyCertificate(hash)` — the public
 * `/verify/<hash>` page renders this. Carries enough to prove authenticity and
 * which offer it belongs to, but NEVER the base64 PDF.
 */
export interface CertificateView {
  readonly certificateId: string;
  readonly hash: string;
  readonly verifyPath: string;
  readonly qrDataUrl: string;
  readonly issuedAt: string;
  readonly instituteApproved: true;
  readonly jdId: string;
  readonly studentId: string;
  readonly wave: number;
  readonly fileName: string;
  readonly version: number;
  readonly pdfChecksum: string;
}

/** Hard cap on the uploaded PDF (~2.8 MB) — keeps base64 + durable-KV practical. */
export const MAX_LETTER_BYTES = 2_800_000;

/** PDF magic bytes `%PDF` — the decoded blob must start with these. */
export const PDF_MAGIC = '%PDF';

/**
 * Boundary schema for `pushOfferLetter`. `pdfBase64` is the raw base64 string
 * (no `data:` prefix). `sizeBytes` is the caller-reported decoded size, capped
 * at {@link MAX_LETTER_BYTES}; the action additionally recomputes the true byte
 * length from the decoded buffer and re-checks the cap (defense in depth).
 */
export const uploadLetterSchema = z.object({
  jdId: z.string().min(1),
  studentId: z.string().min(1),
  wave: z.coerce.number().int().min(1),
  fileName: z.string().min(1).max(255),
  pdfBase64: z.string().min(1),
  sizeBytes: z.coerce.number().int().min(1).max(MAX_LETTER_BYTES),
  /** CTC in paise — folded into the certificate hash so the cert binds the figure. */
  ctcPaise: z.coerce.number().int().min(0).optional(),
  /** Stipend in paise — same hash-binding rationale. */
  stipendPaise: z.coerce.number().int().min(0).optional(),
  /** Optional explicit issue time (ISO); defaults to now. Binds into the hash. */
  issuedAt: z.string().min(1).optional(),
});

export type UploadLetterInput = z.infer<typeof uploadLetterSchema>;

export interface PushResult {
  readonly ok: boolean;
  readonly reason?: string;
  readonly letter?: OfferLetter;
}
