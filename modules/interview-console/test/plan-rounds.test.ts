import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Round 4 §C — interview-plan + round-advance + tally invariants.
 *
 * These pin the three load-bearing rules the linear interview flow depends on:
 *  1. A locked plan is FROZEN — structural `writePlan` is refused (returns null)
 *     so the day-of grid can only change via `overridePlanAssignment`.
 *  2. "Shortlist round N → advance" advances ONLY candidates whose latest
 *     outcome at round N is 'advance'; hold/reject are bucketed `notAdvanced`
 *     and never surface in round N+1.
 *  3. The After-phase tally sums per-round scores correctly per candidate.
 *
 * The store is JSON-backed off `process.cwd()/.dev-data`; we run inside a fresh
 * temp cwd so the suite is hermetic and never touches real dev data.
 */

const ORIGINAL_CWD = process.cwd();
let tmp: string;

beforeAll(() => {
  tmp = mkdtempSync(join(tmpdir(), 'ic-plan-rounds-'));
  process.chdir(tmp);
});

afterAll(() => {
  process.chdir(ORIGINAL_CWD);
  rmSync(tmp, { recursive: true, force: true });
});

// Import AFTER chdir is wired so the store resolves its path under the temp cwd.
// (The path is resolved per-call from process.cwd(), so static import is fine,
//  but we keep a fresh JD id per test to avoid cross-test bleed in the file.)
import {
  advanceRound,
  candidatesForRound,
  computeTally,
  getInterviewPlan,
  lockInterviewPlan,
  recordRoundOutcome,
  saveInterviewPlan,
  seedPlanFromJd,
} from '../src/index';

let jdSeq = 0;
function freshJd(): string {
  jdSeq += 1;
  return `jd_test_${jdSeq.toString().padStart(4, '0')}`;
}

describe('interview plan lock', () => {
  it('refuses a structural writePlan once the plan is locked', () => {
    const jdId = freshJd();
    const seeded = seedPlanFromJd({ jdId, durationMin: 45, roundLabels: ['Screen', 'Final'] });
    expect(seeded).not.toBeNull();
    expect(seeded?.locked).toBe(false);
    expect(seeded?.rounds).toHaveLength(2);

    const locked = lockInterviewPlan(jdId);
    expect(locked?.locked).toBe(true);
    expect(locked?.lockedAt).toBeTypeOf('string');

    // A structural re-save must be REFUSED (null) and must not mutate the plan.
    const refused = saveInterviewPlan({
      jdId,
      durationMin: 90,
      rounds: [{ round: 1, label: 'Tampered' }],
      slots: [],
      assignments: [],
    });
    expect(refused).toBeNull();

    const after = getInterviewPlan(jdId);
    expect(after?.durationMin).toBe(45); // unchanged
    expect(after?.rounds.map((r) => r.label)).toEqual(['Screen', 'Final']);
    expect(after?.locked).toBe(true);
  });

  it('seedPlanFromJd never clobbers an already-locked plan', () => {
    const jdId = freshJd();
    seedPlanFromJd({ jdId, durationMin: 30, roundLabels: ['Only'] });
    lockInterviewPlan(jdId);
    const reseed = seedPlanFromJd({ jdId, durationMin: 120, roundLabels: ['A', 'B', 'C'] });
    expect(reseed?.locked).toBe(true);
    expect(reseed?.rounds).toHaveLength(1); // original survives
  });
});

describe('advanceRound', () => {
  it('advances only candidates whose latest round-1 outcome is "advance"', () => {
    const jdId = freshJd();
    // Three candidates, round 1: A advances, B holds, C rejects.
    recordRoundOutcome(jdId, 'stuA', { round: 1, outcome: 'advance', score: 8 });
    recordRoundOutcome(jdId, 'stuB', { round: 1, outcome: 'hold', score: 5 });
    recordRoundOutcome(jdId, 'stuC', { round: 1, outcome: 'reject', score: 2 });

    const touched = advanceRound(jdId, 1);
    expect(touched).toHaveLength(3);

    const byId = new Map(touched.map((p) => [p.studentId, p]));
    expect(byId.get('stuA')?.advancedThroughRound).toBe(1);
    expect(byId.get('stuA')?.notAdvanced).toBeUndefined();
    expect(byId.get('stuB')?.advancedThroughRound).toBe(0);
    expect(byId.get('stuB')?.notAdvanced).toBe(true);
    expect(byId.get('stuC')?.advancedThroughRound).toBe(0);
    expect(byId.get('stuC')?.notAdvanced).toBe(true);

    // Round 2 must surface ONLY the advancer.
    const round2 = candidatesForRound(jdId, 2);
    expect(round2.map((p) => p.studentId)).toEqual(['stuA']);
  });

  it('leaves candidates with no activity at the round untouched', () => {
    const jdId = freshJd();
    recordRoundOutcome(jdId, 'stuA', { round: 1, outcome: 'advance' });
    // stuZ exists only at round 2 conceptually — give it no round-1 activity.
    const touched = advanceRound(jdId, 1);
    expect(touched.map((p) => p.studentId)).toEqual(['stuA']);
  });
});

describe('computeTally', () => {
  it('sums per-round scores correctly for finalists', () => {
    const jdId = freshJd();
    // stuA: r1=7, r2=9 → total 16, reached final (round 2).
    recordRoundOutcome(jdId, 'stuA', { round: 1, outcome: 'advance', score: 7 });
    // stuB: r1=6 advance, but holds at r2 with score 4 → total 10, reached final.
    recordRoundOutcome(jdId, 'stuB', { round: 1, outcome: 'advance', score: 6 });
    // stuC: r1 reject score 3 → eliminated, must NOT appear in a round-2 tally.
    recordRoundOutcome(jdId, 'stuC', { round: 1, outcome: 'reject', score: 3 });

    advanceRound(jdId, 1); // stuA + stuB advance to round 2

    recordRoundOutcome(jdId, 'stuA', { round: 2, outcome: 'advance', score: 9 });
    recordRoundOutcome(jdId, 'stuB', { round: 2, outcome: 'hold', score: 4 });

    const tally = computeTally(jdId, 2);
    const byId = new Map(tally.map((r) => [r.studentId, r]));

    expect(byId.has('stuC')).toBe(false); // eliminated at round 1

    const a = byId.get('stuA');
    expect(a?.perRound).toEqual([7, 9]);
    expect(a?.total).toBe(16);
    expect(a?.reachedFinal).toBe(true);

    const b = byId.get('stuB');
    expect(b?.perRound).toEqual([6, 4]);
    expect(b?.total).toBe(10);
    expect(b?.reachedFinal).toBe(true);
  });

  it('treats an unscored round as 0 in the total but undefined in perRound', () => {
    const jdId = freshJd();
    recordRoundOutcome(jdId, 'stuA', { round: 1, outcome: 'advance' }); // no score
    advanceRound(jdId, 1);
    recordRoundOutcome(jdId, 'stuA', { round: 2, outcome: 'advance', score: 5 });

    const [row] = computeTally(jdId, 2);
    expect(row?.perRound).toEqual([undefined, 5]);
    expect(row?.total).toBe(5);
  });
});

// Guard against an unused-binding lint if a future edit drops a hook.
beforeEach(() => {
  expect(tmp).toBeTypeOf('string');
});
