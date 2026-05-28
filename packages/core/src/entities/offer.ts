import type { JdId, OfferId, StudentId } from './ids.js';

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
}
