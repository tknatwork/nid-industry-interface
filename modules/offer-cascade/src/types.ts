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
}

export const issueOfferSchema = z.object({
  jdId: z.string().min(1),
  studentId: z.string().min(1),
  positions: z.coerce.number().int().min(1),
  shortlistRemaining: z.coerce.number().int().min(0),
  ctcPaise: z.coerce.number().int().min(0).optional(),
  stipendPaise: z.coerce.number().int().min(0).optional(),
});

export const responseSchema = z.object({
  jdId: z.string().min(1),
  studentId: z.string().min(1),
  status: z.enum(['accepted', 'declined', 'expired']),
  reason: z.string().optional(),
});

export interface ActionResult {
  readonly ok: boolean;
  readonly reason?: string;
}
