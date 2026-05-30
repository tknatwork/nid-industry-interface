export type TransportMode = 'live' | 'periodic' | 'manual';

export interface ConflictSignal {
  /** Anonymized: the student is mid-interview elsewhere. Never names the competitor. */
  readonly inAnotherInterview: boolean;
  readonly etaBack?: string; // HH:MM
}

export interface QueueEntry {
  readonly studentId: string;
  readonly studentName: string;
  readonly disciplineName: string;
  readonly round: string; // e.g. "Round 2 of 3"
  readonly scheduledTime: string; // HH:MM
  readonly conflict: ConflictSignal;
}

export interface InterviewDayView {
  readonly isDemo: boolean;
  readonly nowInterviewing?: QueueEntry;
  readonly upNext: readonly QueueEntry[];
  readonly runningLateMinutes: number;
}

// ── Round-progress store (Round 2 §O/§Q/§R) ───────────────────────────────
//
// A single shared store keyed by (jdId, studentId) keeps the recruiter console
// and the student-coordinator surfaces in lock-step. The coordinator writes
// coordination signals; the recruiter records per-round outcomes + evaluation
// scores. Both read the same record so the §4.17 "in another interview · ETA"
// reflects real coordinator input, not a mock.

/** Outcome a recruiter records for a single interview round. */
export type RoundOutcome = 'advance' | 'hold' | 'reject';

/** Per-candidate interview decision (§R). Distinct from offer-`declined`. */
export type CandidateDecision = 'selected' | 'rejected' | 'pending';

/** Where the candidate physically is, from the coordinator's vantage (§Q). */
export type Attendance = 'expected' | 'arrived' | 'in-interview' | 'done';

/** One recorded round result for a candidate. Append-only per round number. */
export interface RoundResult {
  readonly round: number;
  readonly outcome: RoundOutcome;
  /** Optional per-round evaluation score (§R). Free 0–10 scale, never a fit/rank judgement. */
  readonly score?: number;
  readonly note?: string;
  readonly at: string; // ISO timestamp
}

/**
 * Coordination signals the student-coordinator writes (§Q). The console reads
 * these to drive the anonymized cross-interview-conflict line and the
 * running-late indicator — replacing the former deterministic mock.
 */
export interface CoordinationSignal {
  /** Anonymized: candidate is mid-interview elsewhere. Never names the competitor. */
  readonly inAnotherInterview: boolean;
  readonly etaBack?: string; // HH:MM
  readonly runningLateMin?: number;
  readonly attendance: Attendance;
}

/** Full persisted round-progress record for one (jdId, studentId) pair. */
export interface RoundProgress {
  readonly jdId: string;
  readonly studentId: string;
  /** Highest round reached so far; derived from perRound, surfaced for the queue label. */
  readonly currentRound: number;
  readonly perRound: readonly RoundResult[];
  readonly decision: CandidateDecision;
  readonly coordination: CoordinationSignal;
  /**
   * Highest round the candidate has been *advanced through* via the
   * "Shortlist round N → advance" control (Round 4 §C During). Default 0 means
   * "not yet advanced past any round". A candidate surfaces in round N+1 only
   * once `advancedThroughRound >= N`.
   */
  readonly advancedThroughRound: number;
  /**
   * Set true when an advance-round pass bucketed this candidate as a
   * non-advancer (their latest outcome at the advancing round was not
   * 'advance'). Distinct from `decision: 'rejected'` — they simply did not
   * progress to the next round.
   */
  readonly notAdvanced?: boolean;
  /**
   * Optional pre-interview task score (take-home / evaluation task). Recorded in
   * the After tally and added to the candidate's total alongside the per-round
   * scores. Absent until recorded (exactOptionalPropertyTypes).
   */
  readonly taskScore?: number;
}

// ── Interview plan (Round 4 §C Before) ────────────────────────────────────
//
// The recruiter composes a per-JD interview plan *before* the day: a duration,
// the set of rounds (seeded from JdRecord.interviewRounds), a grid of time
// slots, and per-student assignments (which slot + round + interviewers). Once
// `locked`, the plan is frozen — structural writes are refused; only
// individual assignment overrides are permitted (they are mirrored to the
// recruiter-pipeline audit as `plan-override` entries by the calling action).

/** One interview round in the plan (label seeded from the JD's interviewRounds). */
export interface PlanRound {
  readonly round: number;
  readonly label: string;
}

/** One time-slot column in the Lego timeline grid. */
export interface PlanSlot {
  readonly slotId: string;
  /** Display time, e.g. "14:00". */
  readonly startTime: string;
  readonly durationMin: number;
}

/** A single student placed into a (slot, round) cell with assigned interviewers. */
export interface PlanAssignment {
  readonly studentId: string;
  readonly slotId: string;
  readonly round: number;
  readonly interviewerIds: readonly string[];
}

/** Full interview plan for one JD. Frozen once `locked`. */
export interface InterviewPlan {
  readonly jdId: string;
  readonly durationMin: number;
  readonly rounds: readonly PlanRound[];
  readonly slots: readonly PlanSlot[];
  readonly assignments: readonly PlanAssignment[];
  readonly locked: boolean;
  readonly lockedAt?: string;
  readonly updatedAt: string;
}

/** One row of the After-phase tally: per-round scores + total for a candidate. */
export interface TallyRow {
  readonly studentId: string;
  /** Score per round in ascending round order (undefined where no score recorded). */
  readonly perRound: readonly (number | undefined)[];
  readonly total: number;
  /** True if the candidate has a recorded outcome at the final round. */
  readonly reachedFinal: boolean;
  /** Pre-interview task score, if recorded — already included in `total`. */
  readonly taskScore?: number;
}

// ── Offer-decision letters (Round 4 §C After) ─────────────────────────────
//
// After the recruiter selects candidates, they send a per-JD decision letter:
// an optional written note, an optional voicenote transcript, and the
// recruiter's own experience review (stars). Sending the letter is the Offers
// unlock. One letter per JD (latest send wins).

/** A sent offer-decision letter for one JD. */
export interface Letter {
  readonly noteMd?: string;
  readonly voiceTranscript?: string;
  readonly reviewStars?: number;
  readonly sentAt: string;
}

/** Partial letter payload accepted by writeLetter (sentAt is stamped by the store). */
export interface LetterInput {
  readonly noteMd?: string;
  readonly voiceTranscript?: string;
  readonly reviewStars?: number;
}

/** jdId → sent letter. */
export type LettersMap = Record<string, Letter>;

/** Input accepted by recordRoundOutcome (the timestamp is stamped by the store). */
export interface RoundOutcomeInput {
  readonly round: number;
  readonly outcome: RoundOutcome;
  readonly score?: number;
  readonly note?: string;
}

/** Partial coordination update accepted by setCoordinationSignal. */
export interface CoordinationSignalInput {
  readonly inAnotherInterview?: boolean;
  readonly etaBack?: string;
  readonly runningLateMin?: number;
  readonly attendance?: Attendance;
}
