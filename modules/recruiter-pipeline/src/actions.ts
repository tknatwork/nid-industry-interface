import {
  advanceOptionsSchema,
  auditAppendSchema,
  planEditableAt,
  rankOf,
  type AdvanceOptions,
  type AdvanceResult,
  type AuditAppendInput,
  type AuditEntry,
  type PipelineStage,
  type PipelineState,
} from './types';
import { auditIdFor, readCounter, readPipeline, writePipeline } from './store';

/** The JD's current pipeline stage. */
export function getStage(jdId: string): PipelineStage {
  return readPipeline(jdId).stage;
}

/** The JD's full pipeline state (stage + per-stage timestamps + audit trail). */
export function getPipeline(jdId: string): PipelineState {
  return readPipeline(jdId);
}

/**
 * Forward-only guard: an advance is permitted iff the target outranks the
 * current stage (`rank(to) > rank(from)`). Equal/earlier targets are rejected
 * here — and treated as idempotent no-ops by `advanceStage`.
 */
export function canAdvanceTo(jdId: string, to: PipelineStage): boolean {
  return rankOf(to) > rankOf(getStage(jdId));
}

/** Append-only read of the JD's audit ledger (insertion order preserved). */
export function listAudit(jdId: string): readonly AuditEntry[] {
  return readPipeline(jdId).audit;
}

/**
 * Whether the Before "Lego" plan is still structurally editable for this JD.
 * True only before `plan-locked` (i.e. while `published`/`shortlisting`); once
 * the plan is locked the frozen grid is immutable and day-of changes become
 * `plan-override` audit entries layered on top (Round 4 §B active-log rule).
 */
export function isPlanEditable(jdId: string): boolean {
  return planEditableAt(getStage(jdId));
}

/**
 * Append one immutable entry to the JD's audit ledger WITHOUT changing the
 * stage. Used by calling server actions to record domain events (round
 * recorded, plan override, letter sent, …). Returns the appended entry, or
 * `null` if the input fails validation.
 */
export function appendAudit(jdId: string, input: AuditAppendInput): AuditEntry | null {
  const parsed = auditAppendSchema.safeParse(input);
  if (!parsed.success) return null;
  const { actorRecruiterId, action, summary, studentId, round, meta } = parsed.data;

  const current = readPipeline(jdId);
  const nextCounter = readCounter() + 1;
  const entry: AuditEntry = {
    id: auditIdFor(nextCounter),
    at: new Date().toISOString(),
    actorRecruiterId,
    action,
    stageAt: current.stage,
    summary,
    ...(studentId !== undefined ? { studentId } : {}),
    ...(round !== undefined ? { round } : {}),
    ...(meta !== undefined ? { meta } : {}),
  };

  writePipeline({ ...current, audit: [...current.audit, entry] }, nextCounter);
  return entry;
}

/**
 * Advance the JD's pipeline to `to`. Forward-only and idempotent:
 *  - if `to` outranks the current stage → moves forward, stamps `enteredAt[to]`,
 *    and appends a `stage-advanced` audit entry (or the caller-supplied action);
 *  - if `to` equals or precedes the current stage → NO-OP (no write, no audit),
 *    so a re-advance or a stray backward POST changes nothing.
 *
 * `actor` is a plain recruiter-id string (ownership is enforced by the calling
 * server action via `requireOwnedJd`, mirroring interview-console).
 */
export function advanceStage(
  jdId: string,
  to: PipelineStage,
  actor: string,
  opts?: AdvanceOptions,
): AdvanceResult {
  const current = readPipeline(jdId);

  // Idempotent / forward-only: equal or backward target does nothing.
  if (rankOf(to) <= rankOf(current.stage)) {
    return { ok: true, stage: current.stage, advanced: false };
  }

  const parsedOpts = advanceOptionsSchema.safeParse(opts ?? {});
  if (!parsedOpts.success) {
    return {
      ok: false,
      stage: current.stage,
      advanced: false,
      reason: parsedOpts.error.issues[0]?.message ?? 'Invalid advance options',
    };
  }
  const { summary, studentId, round, meta } = parsedOpts.data;

  const at = new Date().toISOString();
  const nextCounter = readCounter() + 1;
  const entry: AuditEntry = {
    id: auditIdFor(nextCounter),
    at,
    actorRecruiterId: actor,
    action: 'stage-advanced',
    // The action is stamped against the stage just entered (`to`).
    stageAt: to,
    summary: summary ?? `Stage advanced to ${to}`,
    ...(studentId !== undefined ? { studentId } : {}),
    ...(round !== undefined ? { round } : {}),
    ...(meta !== undefined ? { meta } : {}),
  };

  const next: PipelineState = {
    ...current,
    stage: to,
    enteredAt: { ...current.enteredAt, [to]: at },
    audit: [...current.audit, entry],
  };
  writePipeline(next, nextCounter);
  return { ok: true, stage: to, advanced: true };
}
