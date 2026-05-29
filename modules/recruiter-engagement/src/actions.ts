import {
  bookMeetingSchema,
  bookPptSchema,
  publishMeetingSlotSchema,
  publishPptWindowSchema,
  type ActionResult,
  type Meeting,
  type MeetingSlot,
  type PptBooking,
  type PptWindow,
} from './types';
import {
  insertMeeting,
  insertMeetingSlot,
  insertPptBooking,
  insertPptWindow,
  listMeetings as storeListMeetings,
  listMeetingSlots as storeListMeetingSlots,
  listPptBookings as storeListPptBookings,
  listPptWindows as storeListPptWindows,
  meetingSlotById,
  pptWindowById,
} from './store';

export function listPptWindows(cycleId: string): readonly PptWindow[] {
  return storeListPptWindows(cycleId);
}
export function listPptBookings(recruiterId: string): readonly PptBooking[] {
  return storeListPptBookings(recruiterId);
}
export function listMeetingSlots(): readonly MeetingSlot[] {
  return storeListMeetingSlots();
}
export function listMeetings(recruiterId: string): readonly Meeting[] {
  return storeListMeetings(recruiterId);
}

export function bookPpt(input: unknown): ActionResult {
  const parsed = bookPptSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: parsed.error.issues[0]?.message ?? 'Invalid' };
  const window = pptWindowById(parsed.data.windowId);
  if (!window) return { ok: false, reason: 'PPT window not found.' };
  if (window.status !== 'open') return { ok: false, reason: 'That window is already booked.' };
  insertPptBooking({
    windowId: parsed.data.windowId,
    recruiterId: parsed.data.recruiterId,
    deckUrl: parsed.data.deckUrl,
    agenda: parsed.data.agenda,
    ...(parsed.data.meetingLinkUrl ? { meetingLinkUrl: parsed.data.meetingLinkUrl } : {}),
  });
  return { ok: true };
}

export function bookMeeting(input: unknown): ActionResult {
  const parsed = bookMeetingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: parsed.error.issues[0]?.message ?? 'Invalid' };
  const slot = meetingSlotById(parsed.data.slotId);
  if (!slot) return { ok: false, reason: 'Meeting slot not found.' };
  if (slot.status !== 'open') return { ok: false, reason: 'That slot is already taken.' };
  insertMeeting({
    slotId: parsed.data.slotId,
    recruiterId: parsed.data.recruiterId,
    agenda: parsed.data.agenda,
    ...(parsed.data.note ? { note: parsed.data.note } : {}),
  });
  return { ok: true };
}

// ── Admin publishing (the supply side) ───────────────────────────────────────

export function publishPptWindow(input: unknown): ActionResult {
  const parsed = publishPptWindowSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: parsed.error.issues[0]?.message ?? 'Invalid' };
  insertPptWindow(parsed.data);
  return { ok: true };
}

export function publishMeetingSlot(input: unknown): ActionResult {
  const parsed = publishMeetingSlotSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: parsed.error.issues[0]?.message ?? 'Invalid' };
  insertMeetingSlot(parsed.data);
  return { ok: true };
}
