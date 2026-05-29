import { describe, expect, it } from 'vitest';
import { MAX_WAVES, canIssueOffers, describeCascade } from '../src/rules/offer-cascade';
import type { CascadeState } from '../src/rules/offer-cascade';
import type { Offer } from '../src/entities/offer';
import type { JdId, OfferId, StudentId } from '../src/entities/ids';

function state(over: Partial<CascadeState>): CascadeState {
  return { positions: 3, outstanding: 0, accepted: 0, declinedOrExpired: 0, shortlistRemaining: 10, ...over };
}

/** Minimal Offer for cascade rules — only status + wave are read. */
function offer(over: Partial<Offer> & { wave: number; status: Offer['status'] }): Offer {
  return {
    id: 'offer_00001' as OfferId,
    jdId: 'jd_00001' as JdId,
    studentId: 'stu_0001' as StudentId,
    location: '',
    role: '',
    joiningDate: new Date(0),
    offerLetterPdfUrl: '',
    issuedAt: new Date(0),
    windowExpiresAt: new Date(0),
    ...over,
  };
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

describe('describeCascade — 3-wave cap (Round 2 §S)', () => {
  it('defaults to a 3-wave cap (Wave 1 + 2 more)', () => {
    expect(describeCascade([], 3, 5).maxWaves).toBe(3);
    expect(MAX_WAVES).toBe(3);
  });

  it('reports wave-of-N: currentWave 0 / nextWave 1 before any offer', () => {
    const a = describeCascade([], 3, 5);
    expect(a.currentWave).toBe(0);
    expect(a.nextWave).toBe(1);
    expect(a.wavesExhausted).toBe(false);
    expect(a.canFloatNextWave).toBe(true);
  });

  it('derives the current wave from the highest floated wave', () => {
    const offers = [
      offer({ wave: 1, status: 'declined' }),
      offer({ wave: 2, status: 'declined' }),
    ];
    const a = describeCascade(offers, 3, 5);
    expect(a.currentWave).toBe(2);
    expect(a.nextWave).toBe(3);
    expect(a.wavesExhausted).toBe(false);
    expect(a.canFloatNextWave).toBe(true); // wave 3 still allowed
  });

  it('still floats a 3rd wave while slots and shortlist remain', () => {
    // Waves 1 and 2 both declined → 3 slots open, shortlist remains, wave 3 allowed.
    const offers = [
      offer({ wave: 1, status: 'declined' }),
      offer({ wave: 2, status: 'declined' }),
    ];
    const a = describeCascade(offers, 3, 5);
    expect(a.canFloatNextWave).toBe(true);
    expect(a.nextWave).toBe(3);
    expect(a.nextWaveSize).toBe(3);
  });

  it('blocks a 4th wave once 3 waves have floated — surfaces a "waves exhausted" state', () => {
    const offers = [
      offer({ wave: 1, status: 'declined' }),
      offer({ wave: 2, status: 'declined' }),
      offer({ wave: 3, status: 'declined' }),
    ];
    const a = describeCascade(offers, 3, 5); // slots + shortlist remain, but wave cap hit
    expect(a.currentWave).toBe(3);
    expect(a.wavesExhausted).toBe(true);
    expect(a.canFloatNextWave).toBe(false);
    expect(a.nextWaveSize).toBe(0);
    expect(a.reasonIfBlocked).toMatch(/waves exhausted/i);
  });

  it('the wave cap is reported independently of the slot cap', () => {
    // 3 waves floated, all declined → slots are open (so it is NOT a slot-cap
    // block) yet floating stops purely on the wave cap.
    const offers = [
      offer({ wave: 1, status: 'declined' }),
      offer({ wave: 2, status: 'declined' }),
      offer({ wave: 3, status: 'declined' }),
    ];
    const a = describeCascade(offers, 3, 5);
    expect(a.availableSlots).toBe(3); // slots ARE open
    expect(a.reasonIfBlocked).not.toMatch(/positions covered/i);
    expect(a.reasonIfBlocked).toMatch(/close the JD or re-engage the pool/i);
  });

  it('hard cap (outstanding + accepted ≤ positions) still wins even within the wave cap', () => {
    // Wave 1 fully outstanding fills all positions → no slots, even though only
    // 1 wave has floated (wave cap not yet hit).
    const offers = [
      offer({ wave: 1, status: 'pending' }),
      offer({ wave: 1, status: 'pending' }),
      offer({ wave: 1, status: 'accepted' }),
    ];
    const a = describeCascade(offers, 3, 5);
    expect(a.currentWave).toBe(1);
    expect(a.wavesExhausted).toBe(false);
    expect(a.availableSlots).toBe(0);
    expect(a.canFloatNextWave).toBe(false);
    expect(a.reasonIfBlocked).toMatch(/positions covered/i);
  });

  it('honours a custom wave cap override', () => {
    const offers = [offer({ wave: 1, status: 'declined' })];
    const a = describeCascade(offers, 3, 5, 1); // cap of 1 → wave 1 is the last
    expect(a.maxWaves).toBe(1);
    expect(a.wavesExhausted).toBe(true);
    expect(a.canFloatNextWave).toBe(false);
  });
});

describe('canIssueOffers — 3-wave cap (Round 2 §S)', () => {
  it('allows issuing while within the wave cap', () => {
    expect(canIssueOffers(state({ currentWave: 2 }), 1).allowed).toBe(true);
  });

  it('blocks issuing that would open a wave beyond the cap', () => {
    // currentWave passed as 3 means a new (4th) wave would open → blocked.
    const r = canIssueOffers(state({ currentWave: 3 }), 1);
    expect(r.allowed).toBe(false);
    expect(r.reason).toMatch(/waves exhausted/i);
  });

  it('ignores the wave cap when currentWave is omitted (back-compat)', () => {
    expect(canIssueOffers(state({}), 1).allowed).toBe(true);
  });

  it('still blocks the position cap before the wave cap is consulted', () => {
    // 3 accepted already fills positions; even with waves remaining, blocked on cap.
    const r = canIssueOffers(state({ accepted: 3, currentWave: 1 }), 1);
    expect(r.allowed).toBe(false);
    expect(r.reason).toMatch(/position cap/i);
  });

  it('honours a custom maxWaves on the state', () => {
    expect(canIssueOffers(state({ currentWave: 1, maxWaves: 1 }), 1).allowed).toBe(false);
    expect(canIssueOffers(state({ currentWave: 0, maxWaves: 1 }), 1).allowed).toBe(true);
  });
});
