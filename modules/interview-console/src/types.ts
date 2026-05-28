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
