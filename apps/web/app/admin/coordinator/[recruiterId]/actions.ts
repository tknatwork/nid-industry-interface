'use server';

import { revalidatePath } from 'next/cache';
import { getJd } from '@nid/module-jd-posting';
import {
  recordRoundOutcome,
  setCoordinationSignal,
  type Attendance,
  type RoundOutcome,
} from '@nid/module-interview-console';
import { canCoordinatorAccessCompany } from '~/lib/demo-coordinator';

/**
 * Coordinator-scoped writes to the SHARED interview-console round-progress store
 * (plan §Q). Both actions enforce the scope guard twice: the JD must belong to
 * the `recruiterId` the coordinator opened, and that company must be in the
 * coordinator's `assignedCompanies`. A write outside scope is silently dropped
 * (no store mutation, no leak) — the §Q "deny others" rule, defence-in-depth
 * alongside the read-model filtering.
 *
 * These writes are exactly what surfaces on the recruiter's interview console:
 * `recordRoundOutcome` advances the candidate's current round + decision, and
 * `setCoordinationSignal` drives the anonymized "in another interview · ETA"
 * line and the running-late indicator the recruiter sees.
 */

const VALID_OUTCOMES: ReadonlySet<RoundOutcome> = new Set(['advance', 'hold', 'reject']);
const VALID_ATTENDANCE: ReadonlySet<Attendance> = new Set(['expected', 'arrived', 'in-interview', 'done']);

/** True when this (recruiterId, jdId) pair is inside the coordinator's scope. */
function inScope(recruiterId: string, jdId: string): boolean {
  if (!canCoordinatorAccessCompany(recruiterId)) return false;
  const jd = getJd(jdId);
  return jd !== null && jd.recruiterId === recruiterId;
}

/** Record a per-round outcome (advance / hold / reject) with an optional note. */
export async function recordRoundOutcomeAction(formData: FormData): Promise<void> {
  const recruiterId = (formData.get('recruiterId') as string | null)?.trim() ?? '';
  const jdId = (formData.get('jdId') as string | null)?.trim() ?? '';
  const studentId = (formData.get('studentId') as string | null)?.trim() ?? '';
  const outcomeRaw = (formData.get('outcome') as string | null)?.trim() ?? '';
  const roundRaw = (formData.get('round') as string | null)?.trim() ?? '';
  const note = (formData.get('note') as string | null)?.trim() ?? '';

  if (!recruiterId || !jdId || !studentId || !inScope(recruiterId, jdId)) return;
  if (!VALID_OUTCOMES.has(outcomeRaw as RoundOutcome)) return;

  const round = Number.parseInt(roundRaw, 10);
  if (!Number.isInteger(round) || round < 1) return;

  recordRoundOutcome(jdId, studentId, {
    round,
    outcome: outcomeRaw as RoundOutcome,
    ...(note ? { note } : {}),
  });

  revalidatePath(`/admin/coordinator/${recruiterId}`);
}

/**
 * Set a coordination signal (plan §Q): attendance (arrived / in-interview /
 * done), the anonymized "in another interview" flag + ETA-back, or a
 * running-late delay. Partial — only the fields the form submits are merged
 * onto the existing signal.
 */
export async function setCoordinationSignalAction(formData: FormData): Promise<void> {
  const recruiterId = (formData.get('recruiterId') as string | null)?.trim() ?? '';
  const jdId = (formData.get('jdId') as string | null)?.trim() ?? '';
  const studentId = (formData.get('studentId') as string | null)?.trim() ?? '';

  if (!recruiterId || !jdId || !studentId || !inScope(recruiterId, jdId)) return;

  const attendanceRaw = (formData.get('attendance') as string | null)?.trim() ?? '';
  const inAnotherRaw = (formData.get('inAnotherInterview') as string | null)?.trim() ?? '';
  const etaBack = (formData.get('etaBack') as string | null)?.trim() ?? '';
  const lateRaw = (formData.get('runningLateMin') as string | null)?.trim() ?? '';

  const update: {
    attendance?: Attendance;
    inAnotherInterview?: boolean;
    etaBack?: string;
    runningLateMin?: number;
  } = {};

  if (VALID_ATTENDANCE.has(attendanceRaw as Attendance)) {
    update.attendance = attendanceRaw as Attendance;
  }
  if (inAnotherRaw === 'true' || inAnotherRaw === 'false') {
    update.inAnotherInterview = inAnotherRaw === 'true';
  }
  if (/^\d{2}:\d{2}$/.test(etaBack)) {
    update.etaBack = etaBack;
  }
  if (lateRaw) {
    const late = Number.parseInt(lateRaw, 10);
    if (Number.isInteger(late) && late >= 0 && late <= 240) update.runningLateMin = late;
  }

  // Nothing recognized → no-op (avoid an empty write that clobbers nothing).
  if (Object.keys(update).length === 0) return;

  setCoordinationSignal(jdId, studentId, update);
  revalidatePath(`/admin/coordinator/${recruiterId}`);
}
