import { createHash } from 'node:crypto';
import type { OfferCertificate } from './types';

/**
 * Identifying parts folded into the certificate hash. Order is fixed and the
 * serialization is `jdId|studentId|wave|ctc|stipend|issuedAt|pdfChecksum` so the
 * same inputs always yield the same hash, and any change (notably a re-uploaded
 * PDF → new `pdfChecksum`) yields a different one. Optional money fields are
 * normalized to empty string when absent, never the literal `undefined`.
 */
export interface OfferHashParts {
  readonly jdId: string;
  readonly studentId: string;
  readonly wave: number;
  readonly ctcPaise?: number;
  readonly stipendPaise?: number;
  readonly issuedAt: string;
  readonly pdfChecksum: string;
}

/** SHA-256 hex of arbitrary bytes (Buffer or Uint8Array). */
export function sha256Hex(bytes: Buffer | Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

/** SHA-256 hex of a UTF-8 string — the canonical certificate hash channel. */
function sha256OfString(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

/**
 * Compute the stable certificate hash. Deterministic for identical parts;
 * sensitive to every field, especially `pdfChecksum`.
 */
export function computeOfferHash(parts: OfferHashParts): string {
  const canonical = [
    parts.jdId,
    parts.studentId,
    String(parts.wave),
    parts.ctcPaise !== undefined ? String(parts.ctcPaise) : '',
    parts.stipendPaise !== undefined ? String(parts.stipendPaise) : '',
    parts.issuedAt,
    parts.pdfChecksum,
  ].join('|');
  return sha256OfString(canonical);
}

/**
 * Deterministically derive a square grid of on/off modules from the hash. We
 * hash repeatedly to get enough bits to fill an N×N grid, then threshold each
 * byte. This is a *visual placeholder* — a QR-styled glyph, not a scannable QR.
 */
function gridFromHash(hash: string, size: number): readonly boolean[] {
  const needed = size * size;
  const bytes: number[] = [];
  let round = 0;
  while (bytes.length < needed) {
    const digest = createHash('sha256').update(`${hash}:${round}`, 'utf8').digest();
    for (const b of digest) bytes.push(b);
    round += 1;
  }
  return bytes.slice(0, needed).map((b) => (b & 1) === 1);
}

/**
 * Build a QR-styled SVG (PATH B placeholder) and wrap it as a
 * `data:image/svg+xml;utf8,...` data-URL. The module grid is derived from the
 * hash, with the three finder-eye corners drawn in (so it *reads* as a QR at a
 * glance). No QR library is used; do not attempt to scan it — `/verify/<hash>`
 * is the real channel.
 */
export function buildQrDataUrl(hash: string): string {
  const modules = 21; // classic QR v1 footprint, for the right look
  const quiet = 2; // quiet-zone modules on each side
  const unit = 8; // px per module
  const dim = (modules + quiet * 2) * unit;
  const grid = gridFromHash(hash, modules);

  // Finder-eye predicate: the 7×7 corner squares of a real QR code.
  const isFinder = (r: number, c: number): boolean => {
    const inBox = (br: number, bc: number): boolean =>
      r >= br && r < br + 7 && c >= bc && c < bc + 7;
    return inBox(0, 0) || inBox(0, modules - 7) || inBox(modules - 7, 0);
  };

  const rects: string[] = [];
  for (let r = 0; r < modules; r += 1) {
    for (let c = 0; c < modules; c += 1) {
      if (isFinder(r, c)) continue; // finders drawn separately below
      if (!grid[r * modules + c]) continue;
      const x = (c + quiet) * unit;
      const y = (r + quiet) * unit;
      rects.push(`<rect x="${x}" y="${y}" width="${unit}" height="${unit}"/>`);
    }
  }

  // One finder eye: outer 7×7 ring + inner 3×3 dot, at module offset (mr,mc).
  const finder = (mr: number, mc: number): string => {
    const ox = (mc + quiet) * unit;
    const oy = (mr + quiet) * unit;
    const outer = `<rect x="${ox}" y="${oy}" width="${unit * 7}" height="${unit * 7}" fill="none" stroke="#0f172a" stroke-width="${unit}"/>`;
    const inner = `<rect x="${ox + unit * 2}" y="${oy + unit * 2}" width="${unit * 3}" height="${unit * 3}" fill="#0f172a"/>`;
    return outer + inner;
  };

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${dim}" height="${dim}" viewBox="0 0 ${dim} ${dim}" role="img" aria-label="Certificate verification glyph">` +
    `<rect width="${dim}" height="${dim}" fill="#ffffff"/>` +
    `<g fill="#0f172a">${rects.join('')}</g>` +
    finder(0, 0) +
    finder(0, modules - 7) +
    finder(modules - 7, 0) +
    `</svg>`;

  // utf8 data-URL (not base64): keep it inspectable and dependency-free. Encode
  // only the characters that would break the attribute / URL context.
  const encoded = svg
    .replace(/%/g, '%25')
    .replace(/#/g, '%23')
    .replace(/"/g, '%22')
    .replace(/</g, '%3C')
    .replace(/>/g, '%3E')
    .replace(/&/g, '%26')
    .replace(/\n/g, '');
  return `data:image/svg+xml;utf8,${encoded}`;
}

/** Build the public verify path for a given hash. Plain text, session-less. */
export function verifyPathForHash(hash: string): string {
  return `/verify/${hash}`;
}

/**
 * Mint the full institute certificate for an offer letter. `instituteApproved`
 * is always `true` for the prototype — the institute stamps every upload.
 */
export function buildCertificate(
  certificateId: string,
  parts: OfferHashParts,
  issuedAt: string,
): OfferCertificate {
  const hash = computeOfferHash(parts);
  return {
    certificateId,
    hash,
    qrDataUrl: buildQrDataUrl(hash),
    verifyPath: verifyPathForHash(hash),
    issuedAt,
    instituteApproved: true,
  };
}
