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
}

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
