import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * The store writes to `<cwd>/.dev-data/offer-letters.json`. We run each test in
 * an isolated temp cwd so pushes don't collide and the suite is hermetic.
 */
let cwd = '';
let prevCwd = '';

beforeEach(() => {
  prevCwd = process.cwd();
  cwd = mkdtempSync(join(tmpdir(), 'offer-letters-'));
  process.chdir(cwd);
});

afterEach(() => {
  process.chdir(prevCwd);
  if (existsSync(cwd)) rmSync(cwd, { recursive: true, force: true });
});

/** A minimal valid PDF (starts with the %PDF magic) encoded as base64. */
function pdfBase64(marker = 'demo'): string {
  return Buffer.from(`%PDF-1.4\n% offer letter ${marker}\n%%EOF`, 'latin1').toString('base64');
}

async function freshActions() {
  // Re-import after chdir so node:fs paths resolve under the temp cwd. vitest
  // module cache is per-file, and we never mutate module state, so a single
  // import is fine; the store reads cwd lazily on each call.
  return import('../src/actions');
}

describe('pushOfferLetter + verifyCertificate', () => {
  it('pushes a letter, attaches an institute-approved certificate, and verifies', async () => {
    const { pushOfferLetter, verifyCertificate, getOfferLetter } = await freshActions();
    const res = pushOfferLetter({
      jdId: 'jd_00001',
      studentId: 'stu_0005',
      wave: 1,
      fileName: 'offer-aanya.pdf',
      pdfBase64: pdfBase64(),
      sizeBytes: 64,
      ctcPaise: 120000000,
      issuedAt: '2026-05-30T10:00:00.000Z',
    });
    expect(res.ok).toBe(true);
    const letter = res.letter!;
    expect(letter.certificate.instituteApproved).toBe(true);
    expect(letter.certificate.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(letter.certificate.verifyPath).toBe(`/verify/${letter.certificate.hash}`);
    expect(letter.certificate.qrDataUrl.startsWith('data:image/svg+xml;utf8,')).toBe(true);
    expect(letter.version).toBe(1);

    const stored = getOfferLetter('jd_00001', 'stu_0005');
    expect(stored?.pdfBase64.length).toBeGreaterThan(0);

    const view = verifyCertificate(letter.certificate.hash);
    expect(view).not.toBeNull();
    expect(view!.studentId).toBe('stu_0005');
    expect(view!.instituteApproved).toBe(true);
    // The redacted view must NEVER carry the base64 blob.
    expect(JSON.stringify(view)).not.toContain('JVBER'); // %PDF base64 prefix
    expect(Object.prototype.hasOwnProperty.call(view, 'pdfBase64')).toBe(false);
  });

  it('changes the hash and version-bumps when a different PDF is re-pushed', async () => {
    const { pushOfferLetter, verifyCertificate } = await freshActions();
    const first = pushOfferLetter({
      jdId: 'jd_00001',
      studentId: 'stu_0005',
      wave: 1,
      fileName: 'v1.pdf',
      pdfBase64: pdfBase64('one'),
      sizeBytes: 64,
      issuedAt: '2026-05-30T10:00:00.000Z',
    });
    const second = pushOfferLetter({
      jdId: 'jd_00001',
      studentId: 'stu_0005',
      wave: 1,
      fileName: 'v2.pdf',
      pdfBase64: pdfBase64('two-different-bytes'),
      sizeBytes: 80,
      issuedAt: '2026-05-30T10:00:00.000Z',
    });
    expect(first.ok && second.ok).toBe(true);
    expect(second.letter!.version).toBe(2);
    expect(second.letter!.certificate.hash).not.toBe(first.letter!.certificate.hash);
    // The superseded hash no longer resolves; the new one does.
    expect(verifyCertificate(first.letter!.certificate.hash)).toBeNull();
    expect(verifyCertificate(second.letter!.certificate.hash)).not.toBeNull();
  });

  it('rejects a non-PDF blob and an unknown hash', async () => {
    const { pushOfferLetter, verifyCertificate } = await freshActions();
    const notPdf = pushOfferLetter({
      jdId: 'jd_00002',
      studentId: 'stu_0009',
      wave: 1,
      fileName: 'notes.txt',
      pdfBase64: Buffer.from('hello world not a pdf').toString('base64'),
      sizeBytes: 21,
    });
    expect(notPdf.ok).toBe(false);
    expect(verifyCertificate('deadbeef'.repeat(8))).toBeNull();
  });
});
