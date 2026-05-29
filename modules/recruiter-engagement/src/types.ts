import { z } from 'zod';

/**
 * Recruiter engagement types (Phase 4.3 PPT + 4.12 placement-head meetings).
 * Admin publishes windows/slots; the recruiter books them and pastes their own
 * meeting link (no platform integration — Phase 6.11c).
 */

export interface PptWindow {
  readonly id: string;
  readonly cycleId: string;
  readonly day: string; // YYYY-MM-DD
  readonly startTime: string; // HH:MM
  readonly endTime: string;
  readonly mode: 'virtual' | 'on-campus';
  readonly campus: string;
  readonly status: 'open' | 'booked';
}

export interface PptBooking {
  readonly id: string;
  readonly windowId: string;
  readonly recruiterId: string;
  readonly deckUrl: string;
  readonly meetingLinkUrl?: string;
  readonly agenda: readonly string[];
  readonly bookedAt: string;
}

export interface MeetingSlot {
  readonly id: string;
  readonly placementHead: string;
  readonly campus: string;
  readonly day: string;
  readonly time: string;
  readonly status: 'open' | 'booked';
}

export interface Meeting {
  readonly id: string;
  readonly slotId: string;
  readonly recruiterId: string;
  readonly agenda: readonly string[];
  readonly note?: string;
  readonly scheduledAt: string;
}

export const bookPptSchema = z.object({
  windowId: z.string().min(1),
  recruiterId: z.string().min(1),
  deckUrl: z.string().trim().min(3, 'Paste a link to your deck'),
  meetingLinkUrl: z.string().trim().optional(),
  agenda: z.array(z.string().trim().min(1)).min(1, 'Add at least one agenda point'),
});

export const bookMeetingSchema = z.object({
  slotId: z.string().min(1),
  recruiterId: z.string().min(1),
  agenda: z.array(z.string().trim().min(1)).min(1),
  note: z.string().trim().max(500).optional(),
});

// Admin publishing — the supply side (admin opens the windows/slots recruiters book).
export const publishPptWindowSchema = z.object({
  cycleId: z.string().min(1),
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Day must be YYYY-MM-DD'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start must be HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'End must be HH:MM'),
  mode: z.enum(['virtual', 'on-campus']),
  campus: z.string().trim().min(1, 'Campus is required'),
});

export const publishMeetingSlotSchema = z.object({
  placementHead: z.string().trim().min(1, 'Placement head is required'),
  campus: z.string().trim().min(1, 'Campus is required'),
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Day must be YYYY-MM-DD'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM'),
});

/** The default agenda template auto-attached to a placement-head meeting (4.12). */
export const DEFAULT_MEETING_AGENDA: readonly string[] = [
  'Confirm cycle dates relevant to your hire',
  'Confirm discipline targeting + stipend floors',
  'Walk through any JD analyzer flags',
  'Discuss past-cycle hiring outcomes (returning recruiters)',
];

export interface ActionResult {
  readonly ok: boolean;
  readonly reason?: string;
}
