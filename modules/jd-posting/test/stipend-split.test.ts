import { describe, it, expect } from 'vitest';
import { submitForModeration, gateReportFor } from '../src/actions';
import type { JdRecord } from '../src/types';

/**
 * Round 2 §N — split-compensation floor gating.
 *
 * Floors (full-time, annual CTC): B.Des ₹4.5L, M.Des ₹6.0L.
 *
 * These tests pin the invariant "each programme gated against its OWN floor"
 * and would have caught the two opposite-direction bugs adversarial review
 * surfaced:
 *  - the client predictor over-blocked a valid B.Des-near-its-floor JD by
 *    comparing it against the M.Des floor, and
 *  - the server gate under-enforced by never checking B.Des against the B.Des
 *    floor (it only saw the mirrored M.Des value).
 */

const L = (lakh: number) => Math.round(lakh * 100_000 * 100); // ₹<lakh>L → paise

function baseDraft(over: Record<string, unknown> = {}) {
  return {
    recruiterId: 'NID-2026-A-0001',
    cycleId: 'cycle_spring_2026',
    title: 'Product Designer',
    roleType: 'full-time',
    location: 'Bengaluru',
    workMode: 'hybrid',
    positions: 2,
    targetProgrammes: ['bachelors', 'masters'],
    targetDisciplineIds: ['disc_product_design'],
    skills: [{ slug: 'user-research', required: true }],
    responsibilities: { design: ['Own product flows end to end'] },
    deliverables: ['Ship the onboarding redesign'],
    interviewRounds: [{ round: 1, focus: 'Portfolio review' }],
    gpFeeAcknowledged: true,
    ...over,
  };
}

function makeJd(over: Partial<JdRecord> = {}): JdRecord {
  return {
    id: 'jd_test',
    recruiterId: 'NID-2026-A-0001',
    cycleId: 'cycle_spring_2026',
    status: 'in-moderation',
    title: 'Product Designer',
    roleType: 'full-time',
    location: 'Bengaluru',
    workMode: 'hybrid',
    positions: 2,
    targetProgrammes: ['bachelors', 'masters'],
    targetDisciplineIds: ['disc_product_design'],
    skills: [{ slug: 'user-research', required: true }],
    responsibilities: { design: ['Own product flows end to end'] },
    deliverables: ['Ship the onboarding redesign'],
    interviewRounds: [{ round: 1, focus: 'Portfolio review' }],
    gpFeeAcknowledged: true,
    draftedAt: '2026-05-01T00:00:00.000Z',
    ...over,
  };
}

describe('split-compensation stipend floor (Round 2 §N)', () => {
  it('BLOCKS submit when B.Des is below its OWN floor even though M.Des clears (server under-enforcement regression)', () => {
    const r = submitForModeration(
      baseDraft({
        programmeCompensation: {
          bachelors: { baseMinPaise: L(4.0), baseMaxPaise: L(4.0) }, // < ₹4.5L B.Des floor
          masters: { baseMinPaise: L(6.0), baseMaxPaise: L(6.0) }, // = ₹6.0L M.Des floor
        },
      }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.failure.kind).toBe('stipend-floor');
      expect(r.failure.message).toContain('B.Des');
    }
  });

  it('ACCEPTS a valid split where B.Des sits near its OWN (lower) floor while M.Des clears its higher floor (client over-block regression)', () => {
    // B.Des ₹4.6L clears its ₹4.5L floor; M.Des ₹6.0L clears its ₹6.0L floor.
    const report = gateReportFor(
      makeJd({
        programmeCompensation: {
          bachelors: { baseMinPaise: L(4.6), baseMaxPaise: L(4.6) },
          masters: { baseMinPaise: L(6.0), baseMaxPaise: L(6.0) },
        },
        baseMinPaise: L(6.0), // mirror (display-only)
        baseMaxPaise: L(6.0),
      }),
    );
    expect(report.stipendFloorPasses).toBe(true);
    expect(report.perProgramme).toHaveLength(2);
    expect(report.perProgramme?.every((p) => p.passes)).toBe(true);
  });

  it('admin report flags B.Des and clears M.Des per-programme', () => {
    const report = gateReportFor(
      makeJd({
        programmeCompensation: {
          bachelors: { baseMinPaise: L(4.0), baseMaxPaise: L(4.0) },
          masters: { baseMinPaise: L(6.0), baseMaxPaise: L(6.0) },
        },
        baseMinPaise: L(6.0),
        baseMaxPaise: L(6.0),
      }),
    );
    expect(report.stipendFloorPasses).toBe(false);
    const bachelors = report.perProgramme?.find((p) => p.programme === 'bachelors');
    const masters = report.perProgramme?.find((p) => p.programme === 'masters');
    expect(bachelors?.passes).toBe(false);
    expect(masters?.passes).toBe(true);
  });

  it('single-programme JD still gates against that one programme floor (no perProgramme breakdown)', () => {
    const report = gateReportFor(
      makeJd({
        targetProgrammes: ['masters'],
        baseMinPaise: L(5.0), // < ₹6.0L M.Des floor
        baseMaxPaise: L(8.0),
      }),
    );
    expect(report.stipendFloorPasses).toBe(false);
    expect(report.perProgramme).toBeUndefined();
  });
});
