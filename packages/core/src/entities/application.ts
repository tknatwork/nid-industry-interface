import type { ApplicationId, JdId, ShortlistId, SlotId, StudentId } from './ids';

export type ApplicationStatus = 'submitted' | 'shortlisted' | 'rejected' | 'withdrawn';

export interface Application {
  readonly id: ApplicationId;
  readonly studentId: StudentId;
  readonly jdId: JdId;
  readonly status: ApplicationStatus;
  readonly coverNoteMd?: string;
  readonly appliedAt: Date;
}

/**
 * Individual shortlist entry (Phase 4.5 — no bulk shortlisting).
 * A non-empty `recruiterNoteMd` is REQUIRED before saving (enforced at the
 * service layer, not just the UI).
 */
export interface Shortlist {
  readonly id: ShortlistId;
  readonly jdId: JdId;
  readonly studentId: StudentId;
  readonly recruiterNoteMd: string; // non-empty enforced
  readonly shortlistedAt: Date;
  readonly invitedToRounds: readonly number[]; // round numbers per JD.interviewRounds
}

/**
 * Admin-published interview slot (Phase 4.6).
 */
export interface Slot {
  readonly id: SlotId;
  readonly jdId?: JdId; // assigned when recruiter books
  readonly day: Date;
  readonly startTime: string; // HH:MM 24h
  readonly endTime: string;
  readonly capacity: number;
  readonly disciplineHintId?: string;
  readonly meetingLinkUrl?: string; // recruiter pastes their own joining link
}
