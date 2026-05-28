'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { publishJd, holdJd } from '@nid/module-jd-posting';

export async function publishJdAction(formData: FormData): Promise<void> {
  const jdId = (formData.get('jdId') as string | null)?.trim();
  const note = (formData.get('note') as string | null)?.trim() ?? undefined;
  const targetDisciplineIds = formData.getAll('disciplineIds').map(String);

  if (!jdId) redirect('/admin/jds');

  const result = publishJd({ jdId, targetDisciplineIds, ...(note ? { note } : {}) });
  if (!result.ok) {
    redirect(`/admin/jds/${jdId}?error=${encodeURIComponent(result.reason ?? 'publish-failed')}`);
  }
  revalidatePath('/admin/jds');
  revalidatePath(`/admin/jds/${jdId}`);
  revalidatePath('/recruiter/jds');
  redirect('/admin/jds');
}

export async function holdJdAction(formData: FormData): Promise<void> {
  const jdId = (formData.get('jdId') as string | null)?.trim();
  const note = (formData.get('note') as string | null)?.trim() ?? '';

  if (!jdId) redirect('/admin/jds');

  const result = holdJd({ jdId, note });
  if (!result.ok) {
    redirect(`/admin/jds/${jdId}?error=${encodeURIComponent(result.reason ?? 'hold-failed')}`);
  }
  revalidatePath('/admin/jds');
  revalidatePath(`/admin/jds/${jdId}`);
  revalidatePath('/recruiter/jds');
  redirect('/admin/jds');
}
