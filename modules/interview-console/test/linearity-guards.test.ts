import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Round 4 Wave 2 — regression tests for the two store-level linearity seals the
 * adversarial pass added (both were "the UI `disabled` was the only lock", which
 * a crafted/replayed server-action POST ignores):
 *
 *  1. A round already advanced past is SEALED — `writeRoundResult` refuses to
 *     overwrite its outcome, so a late "reject at round 1" cannot un-advance a
 *     candidate the linear pipeline already carried forward. A correction within
 *     the still-open round is still allowed.
 *  2. `overridePlanAssignment` (the day-of reassignment path) is POST-lock only —
 *     pre-lock structural changes must go through `saveInterviewPlan`, which keeps
 *     the `plan-override` audit entries truthful to their post-lock meaning.
 *
 * Hermetic: the JSON store resolves its path from `process.cwd()`, so we run in a
 * fresh temp cwd and never touch real dev data.
 */

const ORIGINAL_CWD = process.cwd();
let tmp: string;

beforeAll(() => {
  tmp = mkdtempSync(join(tmpdir(), 'ic-linearity-'));
  process.chdir(tmp);
});

afterAll(() => {
  process.chdir(ORIGINAL_CWD);
  rmSync(tmp, { recursive: true, force: true });
});

import {
  advanceRound,
  getCandidateRounds,
  getInterviewPlan,
  lockInterviewPlan,
  overridePlanAssignment,
  recordRoundOutcome,
  seedPlanFromJd,
} from '../src/index';

let jdSeq = 0;
function freshJd(): string {
  jdSeq += 1;
  return `jd_lin_${jdSeq.toString().padStart(4, '0')}`;
}

describe('round seal — a round advanced past cannot be overwritten', () => {
  it('refuses to overwrite a sealed round, preserving the advanced state', () => {
    const jdId = freshJd();
    recordRoundOutcome(jdId, 'stuA', { round: 1, outcome: 'advance', score: 8 });
    advanceRound(jdId, 1); // seals round 1 for stuA (advancedThroughRound = 1)

    // A replayed/forged "reject at round 1" must now be a NO-OP — the round is sealed.
    const after = recordRoundOutcome(jdId, 'stuA', { round: 1, outcome: 'reject' });
    expect(after.advancedThroughRound).toBe(1);
    expect(after.decision).not.toBe('rejected');
    expect(after.perRound.find((r) => r.round === 1)?.outcome).toBe('advance');

    // Persisted state agrees — no silent flip behind the no-op return.
    const persisted = getCandidateRounds(jdId, 'stuA');
    expect(persisted.perRound.find((r) => r.round === 1)?.outcome).toBe('advance');
    expect(persisted.decision).not.toBe('rejected');
  });

  it('still allows a correction within the current (open) round', () => {
    const jdId = freshJd();
    recordRoundOutcome(jdId, 'stuB', { round: 1, outcome: 'hold', score: 4 });
    // Round 1 is NOT advanced yet → an in-round correction is allowed.
    const corrected = recordRoundOutcome(jdId, 'stuB', { round: 1, outcome: 'advance', score: 9 });
    const r1 = corrected.perRound.find((r) => r.round === 1);
    expect(r1?.outcome).toBe('advance');
    expect(r1?.score).toBe(9);
  });
});

describe('plan override — day-of reassignment is a POST-lock path only', () => {
  it('refuses an override before the plan is locked, allows it after', () => {
    const jdId = freshJd();
    seedPlanFromJd({ jdId, durationMin: 45, roundLabels: ['Screen', 'Final'] });

    const assignment = { studentId: 'stuA', slotId: 'ps_1', round: 1, interviewerIds: ['SR-1'] };

    // Pre-lock: structural changes go through saveInterviewPlan, NOT override.
    expect(overridePlanAssignment(jdId, assignment)).toBeNull();

    lockInterviewPlan(jdId);

    // Post-lock: the day-of override is allowed and lands on the frozen plan.
    const after = overridePlanAssignment(jdId, assignment);
    expect(after).not.toBeNull();
    expect(after?.locked).toBe(true);
    expect(after?.assignments.some((a) => a.studentId === 'stuA' && a.round === 1)).toBe(true);

    // The plan stays locked — the override did not silently unfreeze it.
    expect(getInterviewPlan(jdId)?.locked).toBe(true);
  });
});
