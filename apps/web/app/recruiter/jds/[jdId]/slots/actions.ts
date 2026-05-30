'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { assignInterviewers, assignStudent, unassignStudent } from '@nid/module-slot-booking';
import { requireOwnedJd } from '~/lib/recruiter-jd-guard';
import { DEMO_RECRUITER } from '~/lib/demo-recruiter';
import { subRolesForRecruiter, subRoleLabel } from '~/lib/recruiter-subroles';

export async function assignSlotAction(formData: FormData): Promise<void> {
  const jdId = (formData.get('jdId') as string | null)?.trim() ?? '';
  const studentId = (formData.get('studentId') as string | null)?.trim() ?? '';
  const slotId = (formData.get('slotId') as string | null)?.trim() ?? '';
  const meetingLinkUrl = (formData.get('meetingLinkUrl') as string | null)?.trim() || undefined;

  if (!jdId || !studentId) redirect('/recruiter/jds');
  await requireOwnedJd(jdId);

  if (slotId === '__unassign__') {
    unassignStudent(jdId, studentId);
  } else {
    const result = assignStudent({ jdId, studentId, slotId, meetingLinkUrl });
    if (!result.ok) {
      redirect(`/recruiter/jds/${jdId}/slots?error=${encodeURIComponent(result.reason ?? 'failed')}`);
    }
  }
  revalidatePath(`/recruiter/jds/${jdId}/slots`);
  redirect(`/recruiter/jds/${jdId}/slots`);
}

/**
 * Set the expected interviewers for a candidate's booked slot (plan §P). The
 * picker submits one `interviewers` value per checked sub-role id; setting none
 * clears the list. Requires an existing slot booking for the candidate (the
 * module rejects otherwise).
 */
export async function assignInterviewersAction(formData: FormData): Promise<void> {
  const jdId = (formData.get('jdId') as string | null)?.trim() ?? '';
  const studentId = (formData.get('studentId') as string | null)?.trim() ?? '';
  const submittedIds = formData
    .getAll('interviewers')
    .map((v) => String(v).trim())
    .filter((v) => v.length > 0);

  if (!jdId || !studentId) redirect('/recruiter/jds');
  await requireOwnedJd(jdId);

  // The picker submits sub-role ids; we persist the human-readable labels
  // ("Name · Title") so both the slots page and the interview console can
  // render them directly (plan §P). Unknown ids are dropped.
  const roster = subRolesForRecruiter(DEMO_RECRUITER.recruiterId);
  const wanted = new Set(submittedIds);
  const interviewers = roster.filter((r) => wanted.has(r.id)).map(subRoleLabel);

  const result = assignInterviewers({ jdId, studentId, interviewers });
  if (!result.ok) {
    redirect(`/recruiter/jds/${jdId}/slots?error=${encodeURIComponent(result.reason ?? 'failed')}`);
  }
  revalidatePath(`/recruiter/jds/${jdId}/slots`);
  redirect(`/recruiter/jds/${jdId}/slots`);
}
