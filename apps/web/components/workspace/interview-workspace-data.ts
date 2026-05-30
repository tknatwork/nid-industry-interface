import 'server-only';

import type { JdRecord } from '@nid/module-jd-posting';
import {
  getInterviewPlan,
  seedPlanFromJd,
  getInterviewsComplete,
  listSelected,
  listRoundProgressForJd,
  candidatesForRound,
  computeTally,
  getLetter,
  getTransportMode,
  type InterviewPlan,
  type RoundProgress,
  type TallyRow,
  type Letter,
  type TransportMode,
} from '@nid/module-interview-console';
import { listShortlist } from '@nid/module-candidate-browse';
import { listAssignmentsForJd, slotById } from '@nid/module-slot-booking';
import { getStage, isPlanEditable, type PipelineStage } from '@nid/module-recruiter-pipeline';
import { subRolesForRecruiter, subRoleLabel } from '~/lib/recruiter-subroles';

/**
 * Server-only assembly of the interview-workspace view model (Round 4 §C).
 *
 * Lives apart from the client `InterviewWorkspaceBody` because it value-imports
 * module stores (interview-console / candidate-browse / slot-booking /
 * recruiter-pipeline) — none of which may cross the `'use client'` boundary. It
 * resolves the plan (seeding a fresh one from the JD's rounds when absent),
 * flattens the shortlist + booked slots into plain serializable shapes, and
 * derives the During/After data. Everything returned here is a POJO the client
 * island can render without touching a store.
 */

// ── Serializable shapes handed to the client body ─────────────────────────

export interface RoundVM {
  readonly round: number;
  readonly label: string;
}

export interface SlotVM {
  readonly slotId: string;
  readonly startTime: string;
  readonly durationMin: number;
}

export interface InterviewerVM {
  readonly id: string;
  readonly label: string;
}

export interface PlanAssignmentVM {
  readonly studentId: string;
  readonly slotId: string;
  readonly round: number;
  readonly interviewerIds: readonly string[];
}

/** A shortlisted candidate available to place on the timeline / score. */
export interface CandidateVM {
  readonly studentId: string;
  readonly name: string;
  readonly disciplineName: string;
  readonly note: string;
  /** Booked slot label ("14:00") if the candidate already holds one, else absent. */
  readonly bookedSlotId?: string;
}

/** A During-phase row: candidate eligible in the current round + their next round. */
export interface DuringRowVM {
  readonly studentId: string;
  readonly name: string;
  readonly disciplineName: string;
  /** The round the next outcome should target (advances past completed rounds). */
  readonly nextRound: number;
  readonly perRound: readonly { round: number; outcome: string; score?: number; note?: string }[];
  readonly decision: RoundProgress['decision'];
}

/** An After-phase tally row enriched with candidate identity. */
export interface TallyVM {
  readonly studentId: string;
  readonly name: string;
  readonly disciplineName: string;
  readonly perRound: readonly (number | undefined)[];
  readonly total: number;
  readonly reachedFinal: boolean;
  readonly decision: RoundProgress['decision'];
  /** Pre-interview task score, if recorded — already folded into `total`. */
  readonly taskScore?: number;
}

export interface LetterVM {
  readonly noteMd?: string;
  readonly voiceTranscript?: string;
  readonly reviewStars?: number;
  readonly sentAt: string;
}

export interface InterviewWorkspaceVM {
  readonly jdId: string;
  readonly jdTitle: string;
  readonly positions: number;
  readonly stage: PipelineStage;
  /** True only before `plan-locked` — the Before grid stays editable. */
  readonly planEditable: boolean;
  readonly planLocked: boolean;
  readonly interviewsComplete: boolean;
  readonly durationMin: number;
  readonly rounds: readonly RoundVM[];
  readonly slots: readonly SlotVM[];
  readonly assignments: readonly PlanAssignmentVM[];
  readonly interviewers: readonly InterviewerVM[];
  readonly candidates: readonly CandidateVM[];
  readonly during: readonly DuringRowVM[];
  /** The round the During console is currently working (1-based). */
  readonly currentRound: number;
  readonly finalRound: number;
  readonly tally: readonly TallyVM[];
  readonly selectedCount: number;
  readonly transport: TransportMode;
  /** True when this JD carries a pre-interview take-home / evaluation task. */
  readonly hasTask: boolean;
  /** The evaluation task's title, when present. */
  readonly taskTitle?: string;
  readonly letter?: LetterVM;
}

function planToVM(plan: InterviewPlan): {
  durationMin: number;
  rounds: RoundVM[];
  slots: SlotVM[];
  assignments: PlanAssignmentVM[];
} {
  return {
    durationMin: plan.durationMin,
    rounds: plan.rounds.map((r) => ({ round: r.round, label: r.label })),
    slots: plan.slots.map((s) => ({ slotId: s.slotId, startTime: s.startTime, durationMin: s.durationMin })),
    assignments: plan.assignments.map((a) => ({
      studentId: a.studentId,
      slotId: a.slotId,
      round: a.round,
      interviewerIds: [...a.interviewerIds],
    })),
  };
}

/** Default slot columns synthesized from booked assignments (when the plan has none). */
function slotsFromBookings(jdId: string, durationMin: number): SlotVM[] {
  const seen = new Map<string, SlotVM>();
  for (const a of listAssignmentsForJd(jdId)) {
    if (seen.has(a.slotId)) continue;
    const slot = slotById(a.slotId);
    if (slot) seen.set(a.slotId, { slotId: slot.id, startTime: slot.startTime, durationMin });
  }
  return [...seen.values()].sort((x, y) => x.startTime.localeCompare(y.startTime));
}

export function buildInterviewWorkspaceVM(jd: JdRecord, recruiterId: string): InterviewWorkspaceVM {
  const jdId = jd.id;
  const stage = getStage(jdId);
  const planEditable = isPlanEditable(jdId);
  const interviewsComplete = getInterviewsComplete(jdId);
  // A pre-interview take-home / evaluation task on the JD enables the After-tally
  // task-score input; its score folds into each candidate's total (computeTally).
  const hasTask = jd.evaluationTask?.required === true;
  const taskTitle = jd.evaluationTask?.title;

  const roundLabels = jd.interviewRounds.map((r) => r.focus);
  const finalRound = Math.max(roundLabels.length, 1);
  const durationDefault = 45;

  // Resolve the plan: seed a fresh one (unlocked) from the JD's rounds when none
  // exists, defaulting the timeline columns from any booked slots. `seedPlanFromJd`
  // is a no-op on a locked plan, so this never clobbers a frozen plan.
  let plan = getInterviewPlan(jdId);
  if (plan === null) {
    const seedSlots = slotsFromBookings(jdId, durationDefault);
    plan =
      seedPlanFromJd({
        jdId,
        durationMin: durationDefault,
        roundLabels: roundLabels.length > 0 ? roundLabels : ['Interview'],
        slots: seedSlots,
      }) ?? null;
  }
  const planVM = plan
    ? planToVM(plan)
    : {
        durationMin: durationDefault,
        rounds: (roundLabels.length > 0 ? roundLabels : ['Interview']).map((label, i) => ({ round: i + 1, label })),
        slots: slotsFromBookings(jdId, durationDefault),
        assignments: [] as PlanAssignmentVM[],
      };
  const planLocked = plan?.locked ?? false;

  // Shortlisted candidates → placement pool.
  const assignmentByStudent = new Map(listAssignmentsForJd(jdId).map((a) => [a.studentId, a.slotId]));
  const candidates: CandidateVM[] = listShortlist(jdId).map(({ candidate, note }) => {
    const bookedSlotId = assignmentByStudent.get(candidate.studentId);
    return {
      studentId: candidate.studentId,
      name: candidate.name,
      disciplineName: candidate.disciplineName,
      note,
      ...(bookedSlotId !== undefined ? { bookedSlotId } : {}),
    };
  });
  const nameById = new Map(candidates.map((c) => [c.studentId, c] as const));

  const interviewers: InterviewerVM[] = subRolesForRecruiter(recruiterId).map((r) => ({
    id: r.id,
    label: subRoleLabel(r),
  }));

  // ── During: candidates eligible in the current round ──────────────────────
  // The roster for the CURRENT round comes from the interview ROSTER, not the
  // outcome LEDGER. Round 1 is every shortlisted entrant — they have no recorded
  // outcome yet, so reading `roundProgress` (the ledger) would show nobody right
  // after the plan is locked. That is the Before→During break: we source round 1
  // from the shortlist cohort so the planned students appear ready to be scored.
  // Round N>1 narrows to those advanced through the prior round (ledger-driven).
  // Each student's recorded outcomes, if any, are overlaid from `roundProgress`.
  const progress = listRoundProgressForJd(jdId);
  const currentRound = deriveCurrentRound(progress, finalRound);
  const progressByStudent = new Map(progress.map((p) => [p.studentId, p] as const));
  const rosterIds: readonly string[] =
    currentRound <= 1
      ? // Round 1 entrants = the shortlist cohort, unioned with any student who
        // already has a progress record (e.g. seeded demo data), de-duplicated.
        [...new Set([...candidates.map((c) => c.studentId), ...progress.map((p) => p.studentId)])]
      : candidatesForRound(jdId, currentRound).map((p) => p.studentId);
  const during: DuringRowVM[] = rosterIds.map((studentId) => {
    const p = progressByStudent.get(studentId);
    const perRound = p?.perRound ?? [];
    const latest = perRound[perRound.length - 1];
    const baseRound = p?.currentRound ?? currentRound;
    const nextRound =
      latest === undefined ? currentRound : latest.outcome === 'advance' ? baseRound + 1 : baseRound;
    const c = nameById.get(studentId);
    return {
      studentId,
      name: c?.name ?? studentId,
      disciplineName: c?.disciplineName ?? '',
      nextRound: Math.min(Math.max(nextRound, 1), finalRound),
      perRound: perRound.map((rr) => ({
        round: rr.round,
        outcome: rr.outcome,
        ...(rr.score !== undefined ? { score: rr.score } : {}),
        ...(rr.note !== undefined ? { note: rr.note } : {}),
      })),
      decision: p?.decision ?? 'pending',
    };
  });

  // ── After: tally across all rounds, enriched with identity + decision ─────
  const decisionByStudent = new Map(progress.map((p) => [p.studentId, p.decision] as const));
  const tallyRows: readonly TallyRow[] = computeTally(jdId, finalRound);
  const tally: TallyVM[] = tallyRows.map((row) => {
    const c = nameById.get(row.studentId);
    return {
      studentId: row.studentId,
      name: c?.name ?? row.studentId,
      disciplineName: c?.disciplineName ?? '',
      perRound: row.perRound,
      total: row.total,
      reachedFinal: row.reachedFinal,
      decision: decisionByStudent.get(row.studentId) ?? 'pending',
      ...(row.taskScore !== undefined ? { taskScore: row.taskScore } : {}),
    };
  });

  const letter: Letter | null = getLetter(jdId);
  const letterVM: LetterVM | undefined = letter
    ? {
        ...(letter.noteMd !== undefined ? { noteMd: letter.noteMd } : {}),
        ...(letter.voiceTranscript !== undefined ? { voiceTranscript: letter.voiceTranscript } : {}),
        ...(letter.reviewStars !== undefined ? { reviewStars: letter.reviewStars } : {}),
        sentAt: letter.sentAt,
      }
    : undefined;

  return {
    jdId,
    jdTitle: jd.title,
    positions: jd.positions,
    stage,
    planEditable,
    planLocked,
    interviewsComplete,
    durationMin: planVM.durationMin,
    rounds: planVM.rounds,
    slots: planVM.slots,
    assignments: planVM.assignments,
    interviewers,
    candidates,
    during,
    currentRound,
    finalRound,
    tally,
    selectedCount: listSelected(jdId).length,
    transport: getTransportMode(recruiterId),
    hasTask,
    ...(taskTitle ? { taskTitle } : {}),
    ...(letterVM ? { letter: letterVM } : {}),
  };
}

/**
 * The round the During console is working: the lowest round whose candidates
 * have not all been advanced past. A candidate is "past round N" once
 * `advancedThroughRound >= N`. Defaults to round 1; never exceeds the final round.
 */
function deriveCurrentRound(progress: readonly RoundProgress[], finalRound: number): number {
  for (let round = 1; round <= finalRound; round++) {
    const someoneHere = progress.some(
      (p) => p.advancedThroughRound < round && p.decision !== 'rejected',
    );
    const allAdvancedPast = progress.length > 0 && progress.every((p) => p.advancedThroughRound >= round);
    if (someoneHere || !allAdvancedPast) return Math.min(round, finalRound);
  }
  return finalRound;
}
