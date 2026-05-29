'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { bookMeeting } from '@nid/module-recruiter-engagement';

export async function bookMeetingAction(formData: FormData): Promise<void> {
  const slotId = (formData.get('slotId') as string | null)?.trim() ?? '';
  const recruiterId = (formData.get('recruiterId') as string | null)?.trim() ?? '';
  const note = (formData.get('note') as string | null)?.trim();
  const agenda = ((formData.get('agenda') as string | null) ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  const result = bookMeeting({ slotId, recruiterId, agenda, ...(note ? { note } : {}) });
  if (!result.ok) redirect(`/recruiter/meetings?error=${encodeURIComponent(result.reason ?? 'failed')}`);
  revalidatePath('/recruiter/meetings');
  redirect('/recruiter/meetings');
}
