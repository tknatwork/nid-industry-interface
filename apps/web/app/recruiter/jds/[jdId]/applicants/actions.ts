'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { shortlistCandidate, unshortlistCandidate } from '@nid/module-candidate-browse';
import { requireOwnedJd } from '~/lib/recruiter-jd-guard';

export async function shortlistAction(formData: FormData): Promise<void> {
  const jdId = (formData.get('jdId') as string | null)?.trim();
  const studentId = (formData.get('studentId') as string | null)?.trim();
  const note = (formData.get('note') as string | null)?.trim() ?? '';

  if (!jdId || !studentId) redirect('/recruiter/jds');
  await requireOwnedJd(jdId);

  const result = shortlistCandidate({ jdId, studentId, note });
  if (!result.ok) {
    redirect(`/recruiter/jds/${jdId}/applicants/${studentId}?error=${encodeURIComponent(result.reason ?? 'failed')}`);
  }
  revalidatePath(`/recruiter/jds/${jdId}/applicants`);
  revalidatePath(`/recruiter/jds/${jdId}/applicants/${studentId}`);
  redirect(`/recruiter/jds/${jdId}/applicants/${studentId}`);
}

export async function unshortlistAction(formData: FormData): Promise<void> {
  const jdId = (formData.get('jdId') as string | null)?.trim();
  const studentId = (formData.get('studentId') as string | null)?.trim();
  if (!jdId || !studentId) redirect('/recruiter/jds');
  await requireOwnedJd(jdId);

  unshortlistCandidate(jdId, studentId);
  revalidatePath(`/recruiter/jds/${jdId}/applicants`);
  revalidatePath(`/recruiter/jds/${jdId}/applicants/${studentId}`);
  redirect(`/recruiter/jds/${jdId}/applicants/${studentId}`);
}
