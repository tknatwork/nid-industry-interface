import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  autoFloatNext,
  issueOffer,
  listOffers,
  lockFloatSequence,
  simulateDeadlinePassed,
  sweepExpiredOffers,
  getSequence,
} from '../src/index';

/**
 * The store persists to `<cwd>/.dev-data/offer-cascade.json` (or `/tmp/...` on
 * Vercel) and is re-read on every call. To isolate each test we point
 * `process.cwd()` at a fresh temp dir, so the seed (Wave-1 offer to stu_0005 +
 * a locked jd_00001 sequence) is the clean starting state every time and writes
 * never leak across cases. `VERCEL` is cleared so the cwd path wins.
 */
let dir: string;
const realCwd = process.cwd.bind(process);

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'offer-cascade-'));
  vi.spyOn(process, 'cwd').mockReturnValue(dir);
  delete process.env['VERCEL'];
});

afterEach(() => {
  vi.restoreAllMocks();
  rmSync(dir, { recursive: true, force: true });
});

/** A JD with no seeded state — used to drive a fresh sequence from scratch. */
const FRESH = 'jd_seqtest';

describe('lockFloatSequence', () => {
  it('locks the order when it equals the selected set, then refuses a second lock', () => {
    const selected = ['stu_a', 'stu_b', 'stu_c'];
    const first = lockFloatSequence({ jdId: FRESH, order: ['stu_b', 'stu_a', 'stu_c'] }, selected);
    expect(first.ok).toBe(true);
    expect(getSequence(FRESH)?.order).toEqual(['stu_b', 'stu_a', 'stu_c']);

    const second = lockFloatSequence({ jdId: FRESH, order: ['stu_a', 'stu_b', 'stu_c'] }, selected);
    expect(second.ok).toBe(false);
    expect(second.reason).toMatch(/already locked/i);
    // The original order is untouched by the refused re-lock.
    expect(getSequence(FRESH)?.order).toEqual(['stu_b', 'stu_a', 'stu_c']);
  });

  it('refuses an order that does not match the selected set exactly', () => {
    const selected = ['stu_a', 'stu_b'];
    expect(lockFloatSequence({ jdId: FRESH, order: ['stu_a'] }, selected).ok).toBe(false); // missing one
    expect(lockFloatSequence({ jdId: FRESH, order: ['stu_a', 'stu_x'] }, selected).ok).toBe(false); // foreign id
    expect(lockFloatSequence({ jdId: FRESH, order: ['stu_a', 'stu_a'] }, selected).ok).toBe(false); // duplicate
  });
});

describe('issueOffer — sequence-skip refusal', () => {
  it('refuses out-of-sequence issuance and accepts the next-in-order candidate', () => {
    const selected = ['stu_a', 'stu_b', 'stu_c'];
    expect(lockFloatSequence({ jdId: FRESH, order: ['stu_a', 'stu_b', 'stu_c'] }, selected).ok).toBe(true);

    // Skipping stu_a to offer stu_b is refused.
    const skip = issueOffer({ jdId: FRESH, studentId: 'stu_b', positions: 3, shortlistRemaining: 3 });
    expect(skip.ok).toBe(false);
    expect(skip.reason).toMatch(/out of sequence/i);

    // A candidate not in the locked order is refused outright.
    const foreign = issueOffer({ jdId: FRESH, studentId: 'stu_z', positions: 3, shortlistRemaining: 3 });
    expect(foreign.ok).toBe(false);
    expect(foreign.reason).toMatch(/not in the locked float sequence/i);

    // The head of the order is accepted and carries its sequenceIndex + deadline.
    const head = issueOffer({ jdId: FRESH, studentId: 'stu_a', positions: 3, shortlistRemaining: 3 });
    expect(head.ok).toBe(true);
    const a = listOffers(FRESH).find((o) => o.studentId === 'stu_a');
    expect(a?.sequenceIndex).toBe(0);
    expect(typeof a?.deadlineIso).toBe('string');

    // Now stu_b (next un-offered in order) is allowed.
    expect(issueOffer({ jdId: FRESH, studentId: 'stu_b', positions: 3, shortlistRemaining: 3 }).ok).toBe(true);
    expect(listOffers(FRESH).find((o) => o.studentId === 'stu_b')?.sequenceIndex).toBe(1);
  });

  it('uses the configured deadlineHours to stamp deadlineIso', () => {
    const selected = ['stu_a'];
    lockFloatSequence({ jdId: FRESH, order: ['stu_a'] }, selected);
    expect(issueOffer({ jdId: FRESH, studentId: 'stu_a', positions: 1, shortlistRemaining: 1, deadlineHours: 24 }).ok).toBe(true);
    const o = listOffers(FRESH).find((r) => r.studentId === 'stu_a');
    const gapMs = new Date(o!.deadlineIso!).getTime() - new Date(o!.issuedAt).getTime();
    expect(Math.round(gapMs / (60 * 60 * 1000))).toBe(24);
  });
});

describe('sweepExpiredOffers + autoFloatNext — respects the position cap', () => {
  it('expires a lapsed pending and floats exactly one replacement within a 1-position cap', () => {
    const selected = ['stu_a', 'stu_b', 'stu_c'];
    lockFloatSequence({ jdId: FRESH, order: ['stu_a', 'stu_b', 'stu_c'] }, selected);

    // 1 position: issue to stu_a only — the cap blocks a second outstanding offer.
    expect(issueOffer({ jdId: FRESH, studentId: 'stu_a', positions: 1, shortlistRemaining: 3 }).ok).toBe(true);
    expect(issueOffer({ jdId: FRESH, studentId: 'stu_b', positions: 1, shortlistRemaining: 3 }).ok).toBe(false);

    // Auto-float with the slot still full → nothing floats (cap respected).
    expect(autoFloatNext(FRESH, 1, selected).floated).toEqual([]);

    // stu_a's deadline lapses → swept to expired, reopening the single slot.
    expect(simulateDeadlinePassed({ jdId: FRESH, studentId: 'stu_a' }).ok).toBe(true);
    expect(listOffers(FRESH).find((o) => o.studentId === 'stu_a')?.status).toBe('expired');

    // Auto-float now backfills exactly one (stu_b), never exceeding the cap.
    const r = autoFloatNext(FRESH, 1, selected);
    expect(r.floated).toEqual(['stu_b']);
    const pending = listOffers(FRESH).filter((o) => o.status === 'pending');
    expect(pending).toHaveLength(1);
    expect(pending[0]?.studentId).toBe('stu_b');
    expect(pending[0]?.sequenceIndex).toBe(1);
  });

  it('sweepExpiredOffers reports lapsed deadlines and leaves live offers pending', () => {
    const selected = ['stu_a', 'stu_b'];
    lockFloatSequence({ jdId: FRESH, order: ['stu_a', 'stu_b'] }, selected);
    // 2 positions: both float; deadlines are ~48h out, so a present-time sweep is a no-op.
    issueOffer({ jdId: FRESH, studentId: 'stu_a', positions: 2, shortlistRemaining: 2 });
    issueOffer({ jdId: FRESH, studentId: 'stu_b', positions: 2, shortlistRemaining: 2 });
    expect(sweepExpiredOffers(FRESH).expired).toEqual([]);

    // A sweep dated far in the future lapses both.
    const future = new Date(Date.now() + 1000 * 60 * 60 * 1000);
    expect(sweepExpiredOffers(FRESH, future).expired.sort()).toEqual(['stu_a', 'stu_b']);
  });

  it('autoFloatNext fills multiple open slots in locked order and stops when the sequence is exhausted', () => {
    const selected = ['stu_a', 'stu_b'];
    lockFloatSequence({ jdId: FRESH, order: ['stu_a', 'stu_b'] }, selected);
    // 3 positions but only 2 in the sequence → floats both, then stops (not 3).
    const r = autoFloatNext(FRESH, 3, selected);
    expect(r.floated).toEqual(['stu_a', 'stu_b']);
    expect(listOffers(FRESH).filter((o) => o.status === 'pending')).toHaveLength(2);
    // Re-running floats nothing new (sequence exhausted).
    expect(autoFloatNext(FRESH, 3, selected).floated).toEqual([]);
  });
});

describe('seed integrity (Round 4)', () => {
  it('seeds jd_00001 Wave-1 with sequenceIndex 0, a live deadline, and a locked sequence', () => {
    const offers = listOffers('jd_00001');
    expect(offers).toHaveLength(1);
    expect(offers[0]?.sequenceIndex).toBe(0);
    expect(offers[0]?.deadlineIso).toBeTruthy();
    // ~45h out → not yet lapsed at present time.
    expect(new Date(offers[0]!.deadlineIso!).getTime()).toBeGreaterThan(Date.now());
    expect(sweepExpiredOffers('jd_00001').expired).toEqual([]);
    expect(getSequence('jd_00001')?.order).toEqual(['stu_0005']);
  });
});
