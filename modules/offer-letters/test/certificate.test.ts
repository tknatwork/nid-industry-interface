import { describe, expect, it } from 'vitest';
import { computeOfferHash, sha256Hex, type OfferHashParts } from '../src/certificate';

const base: OfferHashParts = {
  jdId: 'jd_00001',
  studentId: 'stu_0005',
  wave: 1,
  ctcPaise: 120000000,
  stipendPaise: 0,
  issuedAt: '2026-05-30T10:00:00.000Z',
  pdfChecksum: 'a'.repeat(64),
};

describe('computeOfferHash', () => {
  it('is stable for identical inputs', () => {
    expect(computeOfferHash(base)).toBe(computeOfferHash({ ...base }));
  });

  it('changes when the PDF checksum changes', () => {
    const other = computeOfferHash({ ...base, pdfChecksum: 'b'.repeat(64) });
    expect(other).not.toBe(computeOfferHash(base));
  });

  it('changes when an identifying field (wave) changes', () => {
    expect(computeOfferHash({ ...base, wave: 2 })).not.toBe(computeOfferHash(base));
  });

  it('treats an omitted optional field differently from a zero value', () => {
    const withZero = computeOfferHash({ ...base, stipendPaise: 0 });
    const { stipendPaise: _omit, ...withoutStipend } = base;
    expect(computeOfferHash(withoutStipend)).not.toBe(withZero);
  });

  it('produces a 64-char hex SHA-256 digest', () => {
    expect(computeOfferHash(base)).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('sha256Hex', () => {
  it('matches the known digest of an empty buffer', () => {
    expect(sha256Hex(Buffer.alloc(0))).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
  });
});
