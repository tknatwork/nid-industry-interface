import { describe, expect, it } from 'vitest';
import { canIssueOffers, describeCascade } from '../src/rules/offer-cascade';
import type { CascadeState } from '../src/rules/offer-cascade';

function state(over: Partial<CascadeState>): CascadeState {
  return { positions: 3, outstanding: 0, accepted: 0, declinedOrExpired: 0, shortlistRemaining: 10, ...over };
}

describe('canIssueOffers', () => {
  it('allows issuing up to the position cap', () => {
    expect(canIssueOffers(state({}), 3).allowed).toBe(true);
  });

  it('blocks exceeding the cap — no buffer escape valve', () => {
    const r = canIssueOffers(state({ accepted: 2 }), 2); // 2 accepted + 2 new = 4 > 3
    expect(r.allowed).toBe(false);
  });

  it('counts outstanding + accepted against the cap', () => {
    expect(canIssueOffers(state({ outstanding: 1, accepted: 1 }), 1).allowed).toBe(true);
    expect(canIssueOffers(state({ outstanding: 1, accepted: 1 }), 2).allowed).toBe(false);
  });

  it('blocks when the shortlist cannot supply the wave', () => {
    expect(canIssueOffers(state({ shortlistRemaining: 1 }), 3).allowed).toBe(false);
  });
});

describe('describeCascade', () => {
  it('floats up to available slots when shortlist remains', () => {
    const a = describeCascade([], 3, 5);
    expect(a.canFloatNextWave).toBe(true);
    expect(a.availableSlots).toBe(3);
    expect(a.nextWaveSize).toBe(3);
  });

  it('caps the wave at the remaining shortlist size', () => {
    expect(describeCascade([], 3, 2).nextWaveSize).toBe(2);
  });

  it('blocks the next wave when the shortlist is exhausted', () => {
    const a = describeCascade([], 3, 0);
    expect(a.canFloatNextWave).toBe(false);
    expect(a.reasonIfBlocked).toMatch(/exhausted/i);
  });
});
