'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { issueOffer, recordResponse } from '@nid/module-offer-cascade';
import { getInterviewsComplete } from '@nid/module-interview-console';

export async function issueOfferAction(formData: FormData): Promise<void> {
  const jdId = (formData.get('jdId') as string | null)?.trim() ?? '';
  const studentId = (formData.get('studentId') as string | null)?.trim() ?? '';
  const positions = (formData.get('positions') as string | null) ?? '1';
  const shortlistRemaining = (formData.get('shortlistRemaining') as string | null) ?? '0';
  const ctcPaise = (formData.get('ctcPaise') as string | null) ?? undefined;
  const stipendPaise = (formData.get('stipendPaise') as string | null) ?? undefined;

  // Server-side lock (plan §S): the Offers page is LOCKED until interviews are
  // marked "Done & Dusted". The render gate hides the issue forms, but the
  // mutation must enforce the invariant too — a forged/replayed POST must not
  // create an offer before interviews are complete.
  if (!getInterviewsComplete(jdId)) {
    redirect(
      `/recruiter/jds/${jdId}/offers?error=${encodeURIComponent('Mark interviews complete before issuing offers')}`,
    );
  }

  const result = issueOffer({
    jdId,
    studentId,
    positions,
    shortlistRemaining,
    ...(ctcPaise ? { ctcPaise } : {}),
    ...(stipendPaise ? { stipendPaise } : {}),
  });
  if (!result.ok) {
    redirect(`/recruiter/jds/${jdId}/offers?error=${encodeURIComponent(result.reason ?? 'failed')}`);
  }
  revalidatePath(`/recruiter/jds/${jdId}/offers`);
  redirect(`/recruiter/jds/${jdId}/offers`);
}

export async function respondAction(formData: FormData): Promise<void> {
  const jdId = (formData.get('jdId') as string | null)?.trim() ?? '';
  const studentId = (formData.get('studentId') as string | null)?.trim() ?? '';
  const status = (formData.get('status') as string | null)?.trim() ?? '';

  recordResponse({ jdId, studentId, status, reason: 'student response (demo)' });
  revalidatePath(`/recruiter/jds/${jdId}/offers`);
  redirect(`/recruiter/jds/${jdId}/offers`);
}
