'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { bookPpt } from '@nid/module-recruiter-engagement';

export async function bookPptAction(formData: FormData): Promise<void> {
  const windowId = (formData.get('windowId') as string | null)?.trim() ?? '';
  const recruiterId = (formData.get('recruiterId') as string | null)?.trim() ?? '';
  const deckUrl = (formData.get('deckUrl') as string | null)?.trim() ?? '';
  const meetingLinkUrl = (formData.get('meetingLinkUrl') as string | null)?.trim();
  const agenda = ((formData.get('agenda') as string | null) ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  const result = bookPpt({ windowId, recruiterId, deckUrl, agenda, ...(meetingLinkUrl ? { meetingLinkUrl } : {}) });
  if (!result.ok) redirect(`/recruiter/ppt?error=${encodeURIComponent(result.reason ?? 'failed')}`);
  revalidatePath('/recruiter/ppt');
  redirect('/recruiter/ppt');
}
