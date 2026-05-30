'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { closeJd, withdrawJd } from '@nid/module-jd-posting';
import { requireOwnedJd } from '~/lib/recruiter-jd-guard';

export async function closeJdAction(formData: FormData): Promise<void> {
  const jdId = (formData.get('jdId') as string | null)?.trim() ?? '';
  await requireOwnedJd(jdId);
  const collectiveMessage = (formData.get('collectiveMessage') as string | null)?.trim() ?? '';
  const result = closeJd({ jdId, collectiveMessage });
  if (!result.ok) redirect(`/recruiter/offers?jd=${encodeURIComponent(jdId)}&panel=close&error=${encodeURIComponent(result.reason ?? 'failed')}`);
  revalidatePath('/recruiter/offers');
  revalidatePath('/recruiter/jds');
  redirect(`/recruiter/offers?jd=${encodeURIComponent(jdId)}`);
}

export async function withdrawJdAction(formData: FormData): Promise<void> {
  const jdId = (formData.get('jdId') as string | null)?.trim() ?? '';
  await requireOwnedJd(jdId);
  const category = (formData.get('category') as string | null)?.trim() ?? '';
  const reason = (formData.get('reason') as string | null)?.trim() ?? '';
  const result = withdrawJd({ jdId, category, reason });
  if (!result.ok) redirect(`/recruiter/offers?jd=${encodeURIComponent(jdId)}&panel=close&error=${encodeURIComponent(result.reason ?? 'failed')}`);
  revalidatePath('/recruiter/jds');
  redirect('/recruiter/jds');
}
