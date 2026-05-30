'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import {
  saveInterviewPlan,
  lockInterviewPlan,
  overridePlanAssignment,
  advanceRound,
  recordRoundOutcome,
  setCandidateDecision,
  setTaskScore,
  setInterviewsComplete,
  getInterviewsComplete,
  writeLetter,
  setTransportMode,
  type RoundOutcome,
  type RoundOutcomeInput,
  type PlanAssignment,
  type LetterInput,
  type TransportMode,
} from '@nid/module-interview-console';
import {
  advanceStage,
  appendAudit,
  type AuditAppendInput,
} from '@nid/module-recruiter-pipeline';
import { planDraftSchema, planOverrideSchema } from '@nid/module-interview-console';
import { isAccountLocked } from '@nid/module-recruiter-onboarding';
import { requireOwnedJd } from '~/lib/recruiter-jd-guard';
import { readRecruiterSession } from '~/lib/recruiter-session';

/**
 * Interview workspace server actions (Round 4 §C). Each action follows the
 * canonical guard order:
 *   1. `requireOwnedJd(jdId)` — 404s a foreign/guessable JD before anything.
 *   2. account-lock guard — a recruiter locked between cycles is bounced to
 *      `/recruiter/reactivate` (mirrors the dashboard + offers write path).
 *   3. mutate the owning module(s) + append the recruiter-pipeline audit trail.
 *   4. `revalidatePath` + `redirect` back to the workspace, preserving the
 *      `?jd=` selector and the `?phase=` tab so the recruiter stays in place.
 *
 * The pipeline module owns the linear stage + the immutable audit ledger; the
 * interview-console module owns the plan / round results / letter. Ownership is
 * enforced here (the modules take a plain `actor` string), exactly as the plan's
 * §B "ownership enforced in the calling server action" rule requires.
 */

const WORKSPACE = '/recruiter/interviews';

function str(formData: FormData, key: string): string {
  return (formData.get(key) as string | null)?.trim() ?? '';
}

/** Re-render + return to the workspace for `jdId`, preserving the phase tab. */
function back(jdId: string, phase?: string): never {
  revalidatePath(WORKSPACE);
  const params = new URLSearchParams();
  if (jdId) params.set('jd', jdId);
  if (phase) params.set('phase', phase);
  const qs = params.toString();
  redirect(qs ? `${WORKSPACE}?${qs}` : WORKSPACE);
}

/**
 * Shared front-half of every mutating action: confirm ownership, then bounce a
 * locked account to reactivate. Returns the resolved session recruiter id so the
 * caller can stamp it as the audit actor.
 */
async function guard(jdId: string): Promise<string> {
  await requireOwnedJd(jdId);
  const { recruiterId } = await readRecruiterSession();
  if (isAccountLocked(recruiterId)) {
    redirect('/recruiter/reactivate');
  }
  return recruiterId;
}

// ── BEFORE: plan save / lock / override ───────────────────────────────────

/**
 * Persist a Lego-timeline draft (duration + rounds + slots + assignments). The
 * client island posts the whole draft as a JSON string in a hidden `draft`
 * field; we parse it with `planDraftSchema` at the boundary. The store refuses
 * the write once the plan is locked, so a stray re-save after lock is a no-op.
 */
export async function savePlanAction(formData: FormData): Promise<void> {
  const jdId = str(formData, 'jdId');
  if (!jdId) back('');
  await guard(jdId);

  const parsed = planDraftSchema.safeParse(safeJson(str(formData, 'draft')));
  if (parsed.success) {
    saveInterviewPlan(parsed.data);
  }
  back(jdId, 'before');
}

/**
 * Freeze the Before plan. Locks the plan in interview-console, advances the
 * pipeline to `plan-locked` (forward-only no-op if already past), and records a
 * `plan-locked` audit entry. After this the grid renders static and only
 * single-cell overrides are allowed.
 */
export async function lockPlanAction(formData: FormData): Promise<void> {
  const jdId = str(formData, 'jdId');
  if (!jdId) back('');
  const actor = await guard(jdId);

  const locked = lockInterviewPlan(jdId);
  if (locked) {
    advanceStage(jdId, 'plan-locked', actor, { summary: 'Interview plan locked' });
    audit(jdId, { actorRecruiterId: actor, action: 'plan-locked', summary: 'Interview plan locked' });
  }
  back(jdId, 'before');
}

/**
 * Override a single assignment cell after lock (day-of reassignment). Validated
 * with `planOverrideSchema`; mirrored to the pipeline audit as `plan-override`
 * (the active-log overlay on the frozen grid). The locked plan is never mutated
 * in place — `overridePlanAssignment` writes an override the UI layers on top.
 */
export async function overrideAssignmentAction(formData: FormData): Promise<void> {
  const jdId = str(formData, 'jdId');
  if (!jdId) back('');
  const actor = await guard(jdId);

  const interviewerIds = formData
    .getAll('interviewerIds')
    .map((v) => String(v).trim())
    .filter((v) => v.length > 0);
  const parsed = planOverrideSchema.safeParse({
    jdId,
    studentId: str(formData, 'studentId'),
    slotId: str(formData, 'slotId'),
    round: str(formData, 'round'),
    interviewerIds,
  });
  if (parsed.success) {
    const assignment: PlanAssignment = {
      studentId: parsed.data.studentId,
      slotId: parsed.data.slotId,
      round: parsed.data.round,
      interviewerIds: parsed.data.interviewerIds,
    };
    const ok = overridePlanAssignment(jdId, assignment);
    if (ok) {
      audit(jdId, {
        actorRecruiterId: actor,
        action: 'plan-override',
        summary: `Reassigned ${parsed.data.studentId} to slot ${parsed.data.slotId} (round ${parsed.data.round})`,
        studentId: parsed.data.studentId,
        round: parsed.data.round,
      });
    }
  }
  back(jdId, 'before');
}

// ── DURING: record outcome / advance round ────────────────────────────────

const outcomeSchema = z.object({
  jdId: z.string().min(1),
  studentId: z.string().min(1),
  round: z.coerce.number().int().min(1),
  outcome: z.enum(['advance', 'hold', 'reject']),
  score: z.coerce.number().min(0).max(10).optional(),
  note: z.string().trim().min(1).optional(),
});

/**
 * Record a per-round outcome (score 0–10 + remarks) from the During console.
 * `recordRoundOutcome` stamps the round; the pipeline gets a `round-recorded`
 * audit entry. We also advance the pipeline to `interviewing` on the first
 * recorded outcome (forward-only no-op afterwards).
 */
export async function recordOutcomeAction(formData: FormData): Promise<void> {
  const jdId = str(formData, 'jdId');
  if (!jdId) back('');
  const actor = await guard(jdId);

  const score = str(formData, 'score');
  const note = str(formData, 'note');
  const parsed = outcomeSchema.safeParse({
    jdId,
    studentId: str(formData, 'studentId'),
    round: str(formData, 'round'),
    outcome: str(formData, 'outcome'),
    ...(score !== '' ? { score } : {}),
    ...(note !== '' ? { note } : {}),
  });
  if (parsed.success) {
    const input: RoundOutcomeInput = {
      round: parsed.data.round,
      outcome: parsed.data.outcome as RoundOutcome,
      ...(parsed.data.score !== undefined ? { score: parsed.data.score } : {}),
      ...(parsed.data.note !== undefined ? { note: parsed.data.note } : {}),
    };
    recordRoundOutcome(jdId, parsed.data.studentId, input);
    advanceStage(jdId, 'interviewing', actor, { summary: 'Interviewing started' });
    audit(jdId, {
      actorRecruiterId: actor,
      action: 'round-recorded',
      summary: `Round ${parsed.data.round} · ${parsed.data.outcome}${parsed.data.score !== undefined ? ` · ${parsed.data.score}/10` : ''}`,
      studentId: parsed.data.studentId,
      round: parsed.data.round,
    });
  }
  back(jdId, 'during');
}

/**
 * "Shortlist round N → advance": lock advancers (latest outcome at `round` is
 * 'advance') through to round N+1, bucket the rest. Records `round-advanced`.
 * When `round` is the final round, this is the cue to compute the tally — the
 * After phase reads it lazily, so here we only advance the pipeline to
 * `tallied`.
 */
export async function advanceRoundAction(formData: FormData): Promise<void> {
  const jdId = str(formData, 'jdId');
  if (!jdId) back('');
  const actor = await guard(jdId);

  const round = Number(str(formData, 'round'));
  const isFinal = str(formData, 'isFinal') === 'true';
  if (Number.isInteger(round) && round >= 1) {
    advanceRound(jdId, round);
    audit(jdId, {
      actorRecruiterId: actor,
      action: 'round-advanced',
      summary: `Advanced shortlist past round ${round}`,
      round,
    });
    if (isFinal) {
      advanceStage(jdId, 'tallied', actor, { summary: 'Final round tallied' });
      audit(jdId, { actorRecruiterId: actor, action: 'tally-computed', summary: 'Tally computed', round });
    }
  }
  back(jdId, isFinal ? 'after' : 'during');
}

// ── AFTER: lock selection / send letter ───────────────────────────────────

/**
 * Lock the After-phase selection. The form submits the chosen student ids under
 * `selected`; everyone with a recorded outcome who is NOT chosen is marked
 * `rejected`. The selection MAY exceed vacancies (the offer cascade enforces the
 * hard cap downstream). Records `candidates-selected`.
 */
export async function lockSelectionAction(formData: FormData): Promise<void> {
  const jdId = str(formData, 'jdId');
  if (!jdId) back('');
  const actor = await guard(jdId);

  // Linearity: once the decision letter is sent (interviews complete), the
  // selection is frozen — it feeds the LIVE offer pool (listSelected). A late
  // re-selection POST must be a no-op, not a silent rewrite of the pool.
  if (getInterviewsComplete(jdId)) back(jdId, 'after');

  const selected = new Set(
    formData.getAll('selected').map((v) => String(v).trim()).filter((v) => v.length > 0),
  );
  const considered = formData
    .getAll('considered')
    .map((v) => String(v).trim())
    .filter((v) => v.length > 0);

  for (const studentId of considered) {
    setCandidateDecision(jdId, studentId, selected.has(studentId) ? 'selected' : 'rejected');
  }
  advanceStage(jdId, 'tallied', actor, { summary: 'Candidates selected' });
  audit(jdId, {
    actorRecruiterId: actor,
    action: 'candidates-selected',
    summary: `${selected.size} selected · ${considered.length - selected.size} rejected`,
  });
  back(jdId, 'after');
}

/**
 * Record pre-interview task scores (0–10) for the JD's evaluation/take-home task.
 * Each finalist row submits a paired `taskStudentId` + `taskScore`; blanks are
 * skipped. The score folds into the candidate's tally total (computeTally).
 * Frozen once interviews are complete, like the rest of the After phase.
 */
export async function recordTaskScoresAction(formData: FormData): Promise<void> {
  const jdId = str(formData, 'jdId');
  if (!jdId) back('');
  const actor = await guard(jdId);

  // Linearity: task scores feed the tally that drives selection — frozen once
  // the decision letter is sent (interviews complete).
  if (getInterviewsComplete(jdId)) back(jdId, 'after');

  const ids = formData.getAll('taskStudentId').map((v) => String(v).trim());
  const scores = formData.getAll('taskScore').map((v) => String(v).trim());
  let count = 0;
  for (let i = 0; i < ids.length; i += 1) {
    const id = ids[i];
    const raw = scores[i];
    if (id === undefined || id === '' || raw === undefined || raw === '') continue;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0 || n > 10) continue;
    setTaskScore(jdId, id, n);
    count += 1;
  }
  if (count > 0) {
    audit(jdId, {
      actorRecruiterId: actor,
      action: 'round-recorded',
      summary: `Recorded ${count} pre-interview task score${count === 1 ? '' : 's'}`,
    });
  }
  back(jdId, 'after');
}

const letterSchema = z.object({
  noteMd: z.string().trim().min(1).optional(),
  voiceTranscript: z.string().trim().min(1).optional(),
  reviewStars: z.coerce.number().int().min(1).max(5).optional(),
});

/**
 * Send the per-JD offer-decision letter (optional note + voicenote transcript +
 * recruiter review stars). This is the Offers unlock: it persists the letter,
 * flips `setInterviewsComplete(true)`, advances the pipeline to
 * `offer-sequencing`, records `letter-sent` + `interviews-complete`, and
 * redirects to the Offers workspace for this JD.
 */
export async function sendLetterAction(formData: FormData): Promise<void> {
  const jdId = str(formData, 'jdId');
  if (!jdId) back('');
  const actor = await guard(jdId);

  const noteMd = str(formData, 'noteMd');
  const voiceTranscript = str(formData, 'voiceTranscript');
  const reviewStars = str(formData, 'reviewStars');
  const parsed = letterSchema.safeParse({
    ...(noteMd !== '' ? { noteMd } : {}),
    ...(voiceTranscript !== '' ? { voiceTranscript } : {}),
    ...(reviewStars !== '' ? { reviewStars } : {}),
  });
  const input: LetterInput = parsed.success
    ? {
        ...(parsed.data.noteMd !== undefined ? { noteMd: parsed.data.noteMd } : {}),
        ...(parsed.data.voiceTranscript !== undefined ? { voiceTranscript: parsed.data.voiceTranscript } : {}),
        ...(parsed.data.reviewStars !== undefined ? { reviewStars: parsed.data.reviewStars } : {}),
      }
    : {};

  writeLetter(jdId, input);
  setInterviewsComplete(jdId, true);
  advanceStage(jdId, 'offer-sequencing', actor, { summary: 'Decision letter sent · offers unlocked' });
  audit(jdId, { actorRecruiterId: actor, action: 'letter-sent', summary: 'Offer-decision letter sent' });
  audit(jdId, { actorRecruiterId: actor, action: 'interviews-complete', summary: 'Interviews marked complete' });

  revalidatePath(WORKSPACE);
  redirect(`/recruiter/offers?jd=${encodeURIComponent(jdId)}`);
}

// ── Transport preference (During console cadence) ─────────────────────────

/** Set the live-update transport mode (Live / Periodic / Manual). */
export async function setTransportAction(formData: FormData): Promise<void> {
  const jdId = str(formData, 'jdId');
  if (!jdId) back('');
  const recruiterId = await guard(jdId);
  const mode = str(formData, 'mode');
  if (mode === 'live' || mode === 'periodic' || mode === 'manual') {
    setTransportMode(recruiterId, mode as TransportMode);
  }
  back(jdId, 'during');
}

// ── helpers ───────────────────────────────────────────────────────────────

/** Append a pipeline audit entry (silently ignores validation failures). */
function audit(jdId: string, input: AuditAppendInput): void {
  appendAudit(jdId, input);
}

/** Parse a JSON string, returning `null` on any failure (never throws). */
function safeJson(raw: string): unknown {
  if (raw === '') return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}
