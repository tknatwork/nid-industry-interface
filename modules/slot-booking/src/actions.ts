import {
  assignInterviewersSchema,
  assignSchema,
  publishSlotSchema,
  type ActionResult,
  type Slot,
  type SlotAssignment,
} from './types';
import {
  assignmentsForJd,
  assignmentsForSlot,
  getSlot,
  listSlots,
  publishSlotRecord,
  removeAssignment,
  setInterviewers,
  upsertAssignment,
} from './store';

/** Admin-only: publish a new interview slot. */
export function publishSlot(input: unknown): { ok: boolean; slot?: Slot; reason?: string } {
  const parsed = publishSlotSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, reason: parsed.error.issues[0]?.message ?? 'Invalid slot' };
  }
  const slot = publishSlotRecord(parsed.data);
  return { ok: true, slot };
}

export function listOpenSlots(cycleId: string): ReadonlyArray<Slot & { booked: number }> {
  return listSlots(cycleId)
    .filter((s) => s.status === 'open')
    .map((s) => ({ ...s, booked: assignmentsForSlot(s.id).length }));
}

/** Recruiter assigns a shortlisted student to an admin-published slot. */
export function assignStudent(input: unknown): ActionResult {
  const parsed = assignSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, reason: parsed.error.issues[0]?.message ?? 'Invalid assignment' };
  }
  const entry: SlotAssignment = {
    jdId: parsed.data.jdId,
    slotId: parsed.data.slotId,
    studentId: parsed.data.studentId,
    ...(parsed.data.meetingLinkUrl ? { meetingLinkUrl: parsed.data.meetingLinkUrl } : {}),
    interviewers: [],
    assignedAt: new Date().toISOString(),
  };
  return upsertAssignment(entry);
}

/**
 * Recruiter sets the expected interviewers for a candidate's booked slot.
 * Interviewers are the company's named sub-roles (HR Director / Hiring Manager /
 * Interviewer — plan §P). Requires an existing slot booking for the candidate.
 */
export function assignInterviewers(input: unknown): ActionResult {
  const parsed = assignInterviewersSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, reason: parsed.error.issues[0]?.message ?? 'Invalid interviewers' };
  }
  // De-dupe while preserving order.
  const interviewers = [...new Set(parsed.data.interviewers)];
  return setInterviewers(parsed.data.jdId, parsed.data.studentId, interviewers);
}

export function unassignStudent(jdId: string, studentId: string): ActionResult {
  removeAssignment(jdId, studentId);
  return { ok: true };
}

export function listAssignmentsForJd(jdId: string): readonly SlotAssignment[] {
  return assignmentsForJd(jdId);
}

export function slotById(slotId: string): Slot | null {
  return getSlot(slotId);
}
