import { z } from 'zod';

export interface Slot {
  readonly id: string;
  readonly cycleId: string;
  readonly day: string; // ISO date (YYYY-MM-DD)
  readonly startTime: string; // HH:MM
  readonly endTime: string; // HH:MM
  readonly capacity: number;
  readonly disciplineHint?: string | undefined;
  readonly status: 'open' | 'closed';
}

export interface SlotAssignment {
  readonly jdId: string;
  readonly slotId: string;
  readonly studentId: string;
  readonly meetingLinkUrl?: string | undefined;
  readonly assignedAt: string;
}

export const publishSlotSchema = z.object({
  cycleId: z.string().min(1),
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Day must be YYYY-MM-DD'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start must be HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'End must be HH:MM'),
  capacity: z.coerce.number().int().min(1).max(50),
  disciplineHint: z.string().optional(),
});

export const assignSchema = z.object({
  jdId: z.string().min(1),
  slotId: z.string().min(1),
  studentId: z.string().min(1),
  meetingLinkUrl: z.string().optional(),
});

export interface ActionResult {
  readonly ok: boolean;
  readonly reason?: string;
}
