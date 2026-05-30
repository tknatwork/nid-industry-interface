import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  advanceStage,
  appendAudit,
  canAdvanceTo,
  getPipeline,
  getStage,
  isPlanEditable,
  listAudit,
} from '../src';

/**
 * Round 4 §B — the "never backwards" + append-only-ledger core. These tests pin
 * the load-bearing invariants the linearity verifier checks: a stage can only
 * move forward, re-advancing (or POSTing a backward target) is a silent no-op,
 * and the audit trail is strictly append-only in insertion order.
 *
 * The store is JSON-backed at `.dev-data/recruiter-pipeline.json`; we clear it
 * around each test so cases are independent and order-stable.
 */
const STORE_FILE = resolve(process.cwd(), '.dev-data', 'recruiter-pipeline.json');
const ACTOR = 'NID-2026-A-0001';

function clearStore(): void {
  if (existsSync(STORE_FILE)) rmSync(STORE_FILE);
}

beforeEach(clearStore);
afterEach(clearStore);

describe('recruiter-pipeline forward-only stage machine', () => {
  it('starts a fresh JD at "published" with an empty audit trail', () => {
    expect(getStage('jd_fresh')).toBe('published');
    expect(getPipeline('jd_fresh').audit).toHaveLength(0);
    expect(isPlanEditable('jd_fresh')).toBe(true);
  });

  it('advances forward, stamps enteredAt, and appends a stage-advanced audit entry', () => {
    const r = advanceStage('jd_a', 'shortlisting', ACTOR);
    expect(r).toMatchObject({ ok: true, advanced: true, stage: 'shortlisting' });

    const p = getPipeline('jd_a');
    expect(p.stage).toBe('shortlisting');
    expect(p.enteredAt['shortlisting']).toBeTypeOf('string');
    expect(p.audit).toHaveLength(1);
    expect(p.audit[0]).toMatchObject({
      action: 'stage-advanced',
      stageAt: 'shortlisting',
      actorRecruiterId: ACTOR,
    });
  });

  it('rejects a backward advance as a no-op (no stage change, no audit write)', () => {
    advanceStage('jd_b', 'interviewing', ACTOR); // jump forward a few stages
    const before = getPipeline('jd_b');
    expect(before.stage).toBe('interviewing');
    expect(before.audit).toHaveLength(1);

    expect(canAdvanceTo('jd_b', 'shortlisting')).toBe(false);
    const r = advanceStage('jd_b', 'shortlisting', ACTOR); // backward
    expect(r).toMatchObject({ ok: true, advanced: false, stage: 'interviewing' });

    const after = getPipeline('jd_b');
    expect(after.stage).toBe('interviewing');
    expect(after.audit).toHaveLength(1); // unchanged — no audit appended
  });

  it('is idempotent: re-advancing to the current stage changes nothing', () => {
    advanceStage('jd_c', 'plan-locked', ACTOR);
    const first = getPipeline('jd_c');
    expect(first.audit).toHaveLength(1);
    const firstEnteredAt = first.enteredAt['plan-locked'];

    expect(canAdvanceTo('jd_c', 'plan-locked')).toBe(false);
    const r = advanceStage('jd_c', 'plan-locked', ACTOR); // same stage again
    expect(r).toMatchObject({ ok: true, advanced: false, stage: 'plan-locked' });

    const second = getPipeline('jd_c');
    expect(second.audit).toHaveLength(1); // no duplicate entry
    expect(second.enteredAt['plan-locked']).toBe(firstEnteredAt); // timestamp preserved
  });

  it('plan editability flips off once plan-locked is reached', () => {
    expect(isPlanEditable('jd_d')).toBe(true); // published
    advanceStage('jd_d', 'shortlisting', ACTOR);
    expect(isPlanEditable('jd_d')).toBe(true); // still before plan-locked
    advanceStage('jd_d', 'plan-locked', ACTOR);
    expect(isPlanEditable('jd_d')).toBe(false); // frozen
  });
});

describe('recruiter-pipeline append-only audit ledger', () => {
  it('preserves audit insertion order across mixed advances and appends', () => {
    advanceStage('jd_e', 'shortlisting', ACTOR, { summary: 'first advance' });
    appendAudit('jd_e', {
      actorRecruiterId: ACTOR,
      action: 'round-recorded',
      summary: 'round 1 scored',
      studentId: 'stu_0005',
      round: 1,
    });
    advanceStage('jd_e', 'plan-locked', ACTOR, { summary: 'second advance' });

    const audit = listAudit('jd_e');
    expect(audit.map((a) => a.action)).toEqual([
      'stage-advanced',
      'round-recorded',
      'stage-advanced',
    ]);
    expect(audit.map((a) => a.summary)).toEqual([
      'first advance',
      'round 1 scored',
      'second advance',
    ]);
    // ids are monotonic in insertion order
    const ids = audit.map((a) => a.id);
    expect([...ids].sort()).toEqual(ids);
  });

  it('stamps optional fields only when supplied (omits undefined for exactOptionalPropertyTypes)', () => {
    const entry = appendAudit('jd_f', {
      actorRecruiterId: ACTOR,
      action: 'plan-override',
      summary: 'moved stu_0005 to slot 3',
      studentId: 'stu_0005',
    });
    expect(entry).not.toBeNull();
    expect(entry).toHaveProperty('studentId', 'stu_0005');
    // round + meta were not provided → keys must be absent, not undefined
    expect(Object.prototype.hasOwnProperty.call(entry, 'round')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(entry, 'meta')).toBe(false);
  });

  it('appendAudit records the stage in force without advancing it', () => {
    advanceStage('jd_g', 'interviewing', ACTOR);
    appendAudit('jd_g', {
      actorRecruiterId: ACTOR,
      action: 'round-advanced',
      summary: 'round 1 → 2',
      round: 1,
    });
    const p = getPipeline('jd_g');
    expect(p.stage).toBe('interviewing'); // appendAudit never moves the stage
    expect(p.audit.at(-1)).toMatchObject({ action: 'round-advanced', stageAt: 'interviewing' });
  });

  it('rejects an invalid audit payload (empty summary) without writing', () => {
    advanceStage('jd_h', 'shortlisting', ACTOR);
    const before = listAudit('jd_h').length;
    const bad = appendAudit('jd_h', {
      actorRecruiterId: ACTOR,
      action: 'letter-sent',
      summary: '', // invalid — min(1)
    });
    expect(bad).toBeNull();
    expect(listAudit('jd_h')).toHaveLength(before); // nothing appended
  });
});
