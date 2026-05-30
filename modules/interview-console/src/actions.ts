import { listAssignmentsForJd, slotById } from '@nid/module-slot-booking';
import { getCandidate } from '@nid/module-candidate-browse';
import type {
  CandidateDecision,
  ConflictSignal,
  CoordinationSignalInput,
  InterviewDayView,
  QueueEntry,
  RoundOutcomeInput,
  RoundProgress,
  RoundResult,
  TransportMode,
} from './types';
import { DEMO_INTERVIEW_DAY } from './demo';
import {
  readInterviewsComplete,
  readRoundProgress,
  readRoundProgressForJd,
  readTransport,
  writeCoordination,
  writeDecision,
  writeInterviewsComplete,
  writeRoundResult,
  writeTransport,
} from './store';

/** Derive the anonymized conflict line the queue renders from the coordinator's signal. */
function conflictFromProgress(progress: RoundProgress): ConflictSignal {
  const { inAnotherInterview, etaBack } = progress.coordination;
  return inAnotherInterview && etaBack !== undefined
    ? { inAnotherInterview, etaBack }
    : { inAnotherInterview };
}

/**
 * Build the interview-day view from real slot assignments. If none exist,
 * return the sandboxed DEMO dataset (Phase 4.7) so the console is never empty.
 *
 * Round number and the anonymized cross-interview-conflict signal are read
 * from the shared round-progress store (§O/§Q): the coordinator writes
 * coordination signals, the recruiter records round outcomes, and this view
 * reflects both — no deterministic mock.
 */
export function buildInterviewDayView(jdId: string): InterviewDayView {
  const assignments = listAssignmentsForJd(jdId);
  if (assignments.length === 0) return DEMO_INTERVIEW_DAY;

  // Order assignments by slot day + start time.
  const enriched = assignments
    .map((a) => {
      const slot = slotById(a.slotId);
      const candidate = getCandidate(a.studentId);
      return slot && candidate ? { a, slot, candidate } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((x, y) => x.slot.day.localeCompare(y.slot.day) || x.slot.startTime.localeCompare(y.slot.startTime));

  const entries: QueueEntry[] = enriched.map((e) => {
    const progress = readRoundProgress(jdId, e.candidate.studentId);
    return {
      studentId: e.candidate.studentId,
      studentName: e.candidate.name,
      disciplineName: e.candidate.disciplineName,
      round: `Round ${progress.currentRound}`,
      scheduledTime: e.slot.startTime,
      conflict: conflictFromProgress(progress),
    };
  });

  // Running-late is the largest coordinator-reported delay across the queue.
  const runningLateMinutes = enriched.reduce((max, e) => {
    const late = readRoundProgress(jdId, e.candidate.studentId).coordination.runningLateMin ?? 0;
    return Math.max(max, late);
  }, 0);

  const [now, ...rest] = entries;
  return {
    isDemo: false,
    ...(now ? { nowInterviewing: now } : {}),
    upNext: rest,
    runningLateMinutes,
  };
}

export function getTransportMode(recruiterId: string): TransportMode {
  return readTransport(recruiterId);
}

export function setTransportMode(recruiterId: string, mode: TransportMode): void {
  writeTransport(recruiterId, mode);
}

// ── Round-progress API (§O/§Q/§R) ─────────────────────────────────────────

/**
 * Record a per-round outcome (advance / hold / reject) with an optional
 * evaluation score + note. Stamps the timestamp, derives currentRound, and —
 * for a reject — flips the candidate decision to 'rejected'. Returns the
 * updated record so callers can re-render without a second read.
 */
export function recordRoundOutcome(jdId: string, studentId: string, input: RoundOutcomeInput): RoundProgress {
  const result: RoundResult = {
    round: input.round,
    outcome: input.outcome,
    at: new Date().toISOString(),
    ...(input.score !== undefined ? { score: input.score } : {}),
    ...(input.note !== undefined ? { note: input.note } : {}),
  };
  return writeRoundResult(jdId, studentId, result);
}

/** Read the full round-progress record for one candidate (never undefined). */
export function getCandidateRounds(jdId: string, studentId: string): RoundProgress {
  return readRoundProgress(jdId, studentId);
}

/** All round-progress records for a JD — drives the coordinator + After-phase lists. */
export function listRoundProgressForJd(jdId: string): readonly RoundProgress[] {
  return readRoundProgressForJd(jdId);
}

/**
 * Coordinator writes a coordination signal (§Q). Merges onto the existing
 * signal so partial updates (just attendance, just ETA) are safe.
 */
export function setCoordinationSignal(jdId: string, studentId: string, input: CoordinationSignalInput): RoundProgress {
  const current = readRoundProgress(jdId, studentId).coordination;
  const inAnotherInterview = input.inAnotherInterview ?? current.inAnotherInterview;
  // `etaBack` is meaningful ONLY while the candidate is in another interview.
  // When the conflict clears (inAnotherInterview === false), drop any stale ETA
  // instead of carrying it forward — otherwise it lingers in the store and
  // resurfaces if the flag is ever set again without a fresh ETA. `runningLateMin`
  // is independent of the conflict (the recruiter's own slot running late), so
  // it keeps its merge behaviour.
  const etaBack = inAnotherInterview ? input.etaBack ?? current.etaBack : undefined;
  const runningLateMin = input.runningLateMin ?? current.runningLateMin;
  return writeCoordination(jdId, studentId, {
    inAnotherInterview,
    attendance: input.attendance ?? current.attendance,
    ...(etaBack !== undefined ? { etaBack } : {}),
    ...(runningLateMin !== undefined ? { runningLateMin } : {}),
  });
}

/** Explicitly set a candidate's interview decision (After-phase selected/rejected). */
export function setCandidateDecision(jdId: string, studentId: string, decision: CandidateDecision): RoundProgress {
  return writeDecision(jdId, studentId, decision);
}

/** Per-JD "Done & Dusted" flag — gates the Offers cascade (§R). */
export function setInterviewsComplete(jdId: string, complete = true): void {
  writeInterviewsComplete(jdId, complete);
}

/** Read the per-JD interviews-complete flag. */
export function getInterviewsComplete(jdId: string): boolean {
  return readInterviewsComplete(jdId);
}

/** Candidates with a 'selected' decision for this JD (§R After phase). */
export function listSelected(jdId: string): readonly RoundProgress[] {
  return readRoundProgressForJd(jdId).filter((p) => p.decision === 'selected');
}

/** Candidates with a 'rejected' decision for this JD (§R After phase). */
export function listRejected(jdId: string): readonly RoundProgress[] {
  return readRoundProgressForJd(jdId).filter((p) => p.decision === 'rejected');
}
