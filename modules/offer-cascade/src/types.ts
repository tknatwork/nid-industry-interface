import { z } from 'zod';

export type OfferStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export interface OfferRecord {
  readonly id: string;
  readonly jdId: string;
  readonly studentId: string;
  readonly wave: number;
  readonly status: OfferStatus;
  readonly ctcPaise?: number;
  readonly stipendPaise?: number;
  readonly issuedAt: string;
  readonly respondedAt?: string;
  readonly responseReason?: string;
  /** Position of this student in the locked float sequence (0-based). Set on
   *  issuance once a sequence is locked; absent for offers issued before the
   *  sequence-builder flow (back-compat). */
  readonly sequenceIndex?: number;
  /** Hard deadline for this wave's response: `issuedAt + deadlineHours`. A
   *  pending offer past this instant is lazily swept to 'expired'. Per-record
   *  (per-wave) so each wave carries its own clock — there is no per-JD schedule. */
  readonly deadlineIso?: string;
}

/**
 * The recruiter-locked order in which offers float for a JD. Built from the
 * After-selected candidate set (Round 4 §D); one-shot — once locked it is the
 * canonical sequence and a second lock is refused. `order` is the studentId
 * sequence; `issueOffer` derives `sequenceIndex` from this order and refuses
 * out-of-sequence issuance.
 */
export interface FloatSequenceRecord {
  readonly jdId: string;
  readonly order: readonly string[];
  readonly lockedAt: string;
}

export const issueOfferSchema = z.object({
  jdId: z.string().min(1),
  studentId: z.string().min(1),
  positions: z.coerce.number().int().min(1),
  shortlistRemaining: z.coerce.number().int().min(0),
  ctcPaise: z.coerce.number().int().min(0).optional(),
  stipendPaise: z.coerce.number().int().min(0).optional(),
  /** Response window in hours; the wave's `deadlineIso` is `issuedAt + this`. */
  deadlineHours: z.coerce.number().int().min(1).default(48),
});

export const responseSchema = z.object({
  jdId: z.string().min(1),
  studentId: z.string().min(1),
  status: z.enum(['accepted', 'declined', 'expired']),
  reason: z.string().optional(),
});

/** Lock the float sequence for a JD. `order` must equal the After-selected set
 *  (validated in the action against `selectedIds`). */
export const lockSequenceSchema = z.object({
  jdId: z.string().min(1),
  order: z.array(z.string().min(1)).min(1),
});

/** Demo control: force a specific pending offer's deadline to lapse, then expire it. */
export const simulateDeadlineSchema = z.object({
  jdId: z.string().min(1),
  studentId: z.string().min(1),
});

export interface ActionResult {
  readonly ok: boolean;
  readonly reason?: string;
}
