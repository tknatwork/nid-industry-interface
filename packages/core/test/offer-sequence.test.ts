import { describe, expect, it } from 'vitest';
import {
  canIssueOffers,
  isDeadlinePassed,
  minutesToDeadline,
  nextInSequence,
} from '../src/rules/offer-cascade';
import type { CascadeState } from '../src/rules/offer-cascade';

/**
 * Round 4 §D — pure offer-sequencing + per-wave deadline rules.
 * Covers `nextInSequence` (order/skip/cap), the two deadline predicates
 * (boundary-inclusive), and a regression that the existing position cap still
 * blocks `outstanding + accepted > positions` (proving the new fns left the
 * cap logic untouched).
 */

describe('nextInSequence', () => {
  const order = ['stu_a', 'stu_b', 'stu_c', 'stu_d'] as const;

  it('returns the first `count` ids in sequence order', () => {
    expect(nextInSequence(order, new Set(), 2)).toEqual(['stu_a', 'stu_b']);
  });

  it('preserves the locked order — never reorders', () => {
    const scrambled = ['stu_c', 'stu_a', 'stu_d', 'stu_b'] as const;
    expect(nextInSequence(scrambled, new Set(), 4)).toEqual(['stu_c', 'stu_a', 'stu_d', 'stu_b']);
  });

  it('skips ids already offered, keeping order among the rest', () => {
    const offered = new Set(['stu_a', 'stu_c']);
    expect(nextInSequence(order, offered, 2)).toEqual(['stu_b', 'stu_d']);
  });

  it('caps the result at `count` even when more remain', () => {
    expect(nextInSequence(order, new Set(), 1)).toEqual(['stu_a']);
    expect(nextInSequence(order, new Set(), 3)).toHaveLength(3);
  });

  it('returns fewer than `count` when the sequence is exhausted', () => {
    const offered = new Set(['stu_a', 'stu_b', 'stu_c']);
    expect(nextInSequence(order, offered, 5)).toEqual(['stu_d']);
  });

  it('returns empty when everyone is already offered', () => {
    const offered = new Set(order);
    expect(nextInSequence(order, offered, 3)).toEqual([]);
  });

  it('returns empty for a non-positive count (no float requested)', () => {
    expect(nextInSequence(order, new Set(), 0)).toEqual([]);
    expect(nextInSequence(order, new Set(), -1)).toEqual([]);
  });

  it('de-duplicates repeated ids within a single pass', () => {
    const dupes = ['stu_a', 'stu_a', 'stu_b'] as const;
    expect(nextInSequence(dupes, new Set(), 3)).toEqual(['stu_a', 'stu_b']);
  });

  it('does not enforce the position cap itself — returns up to `count`', () => {
    // 4 open requested against a 4-long sequence → all four; the cap gate is
    // canIssueOffers, not this picker.
    expect(nextInSequence(order, new Set(), 4)).toHaveLength(4);
  });
});

describe('isDeadlinePassed', () => {
  const deadline = '2026-05-30T12:00:00.000Z';

  it('is false strictly before the deadline', () => {
    expect(isDeadlinePassed(deadline, new Date('2026-05-30T11:59:59.999Z'))).toBe(false);
  });

  it('is true exactly at the deadline (inclusive boundary)', () => {
    expect(isDeadlinePassed(deadline, new Date('2026-05-30T12:00:00.000Z'))).toBe(true);
  });

  it('is true after the deadline', () => {
    expect(isDeadlinePassed(deadline, new Date('2026-05-30T12:00:00.001Z'))).toBe(true);
  });

  it('treats a malformed deadline as not passed (fail-open)', () => {
    expect(isDeadlinePassed('not-a-date', new Date('2099-01-01T00:00:00.000Z'))).toBe(false);
  });
});

describe('minutesToDeadline', () => {
  const deadline = '2026-05-30T12:00:00.000Z';

  it('floors the whole minutes remaining', () => {
    expect(minutesToDeadline(deadline, new Date('2026-05-30T11:00:00.000Z'))).toBe(60);
    // 90s out → 1 whole minute (floored), not 2.
    expect(minutesToDeadline(deadline, new Date('2026-05-30T11:58:30.000Z'))).toBe(1);
  });

  it('clamps to 0 exactly at the deadline', () => {
    expect(minutesToDeadline(deadline, new Date('2026-05-30T12:00:00.000Z'))).toBe(0);
  });

  it('never returns a negative value past the deadline', () => {
    expect(minutesToDeadline(deadline, new Date('2026-05-30T13:30:00.000Z'))).toBe(0);
  });

  it('returns 0 for a malformed deadline', () => {
    expect(minutesToDeadline('', new Date('2026-05-30T11:00:00.000Z'))).toBe(0);
  });
});

describe('regression: position cap still blocks outstanding + accepted > positions', () => {
  function state(over: Partial<CascadeState>): CascadeState {
    return {
      positions: 3,
      outstanding: 0,
      accepted: 0,
      declinedOrExpired: 0,
      shortlistRemaining: 10,
      ...over,
    };
  }

  it('blocks when projected outstanding + accepted would exceed positions', () => {
    // 2 outstanding + 1 accepted already = 3 = cap; one more must be refused.
    const r = canIssueOffers(state({ outstanding: 2, accepted: 1 }), 1);
    expect(r.allowed).toBe(false);
    expect(r.reason).toMatch(/position cap/i);
  });

  it('still allows issuing up to — but not beyond — the cap', () => {
    expect(canIssueOffers(state({ outstanding: 1, accepted: 1 }), 1).allowed).toBe(true);
    expect(canIssueOffers(state({ outstanding: 1, accepted: 1 }), 2).allowed).toBe(false);
  });
});
