import type { JdId, OfferId, StudentId } from './ids';

export type OfferStatus = 'pending' | 'on-hold' | 'accepted' | 'declined' | 'expired';

/**
 * Offer issued by a recruiter to a student. Wave-based cascade (Phase 4.8):
 * Wave 1 floats N offers (N = open positions); on decline/expire, next wave
 * floats to the next-ranked shortlisted students. Outstanding + accepted is
 * ALWAYS <= position count (no buffer).
 */
export interface Offer {
  readonly id: OfferId;
  readonly jdId: JdId;
  readonly studentId: StudentId;
  readonly wave: number;
  readonly ctcPaise?: number; // full-time
  readonly stipendPaise?: number; // internships
  readonly location: string;
  readonly role: string;
  readonly joiningDate: Date;
  readonly offerLetterPdfUrl: string;
  readonly status: OfferStatus;
  readonly issuedAt: Date;
  readonly windowExpiresAt: Date;
  readonly respondedAt?: Date;
  readonly responseReason?: string;
  /**
   * Position of this offer within a locked float sequence (0-based). Set by
   * `issueOffer` from the JD's locked `FloatSequenceRecord.order`. Used to
   * enforce strictly-in-sequence issuance (Round 4 §D).
   */
  readonly sequenceIndex?: number;
  /**
   * Per-wave acceptance deadline as an ISO-8601 instant. Each wave carries its
   * own clock (`issuedAt + deadlineHours`); timeout is a pure per-record
   * predicate evaluated lazily (Round 4 §D), not a per-JD schedule.
   */
  readonly deadlineIso?: string;
}
