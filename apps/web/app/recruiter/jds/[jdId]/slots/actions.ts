'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { assignStudent, unassignStudent } from '@nid/module-slot-booking';

export async function assignSlotAction(formData: FormData): Promise<void> {
  const jdId = (formData.get('jdId') as string | null)?.trim() ?? '';
  const studentId = (formData.get('studentId') as string | null)?.trim() ?? '';
  const slotId = (formData.get('slotId') as string | null)?.trim() ?? '';
  const meetingLinkUrl = (formData.get('meetingLinkUrl') as string | null)?.trim() || undefined;

  if (!jdId || !studentId) redirect('/recruiter/jds');

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
