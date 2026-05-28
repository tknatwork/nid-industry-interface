'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { respondToOfferSchema } from '@nid/module-student-portal';
import { recordResponse } from '@nid/module-offer-cascade';

/**
 * The student's real accept/decline. Validated with the student-facing schema
 * (decision is accepted|declined — a student cannot "expire" their own offer),
 * then routed through offer-cascade.recordResponse, which drives the wave
 * cascade. This is what de-fakes the recruiter offers page's demo control.
 */
export async function respondToOfferAction(formData: FormData): Promise<void> {
  const jdId = (formData.get('jdId') as string | null)?.trim() ?? '';
  const studentId = (formData.get('studentId') as string | null)?.trim() ?? '';
  const decision = (formData.get('decision') as string | null)?.trim() ?? '';
  const reasonRaw = (formData.get('reason') as string | null)?.trim();

  const parsed = respondToOfferSchema.safeParse({
    jdId,
    studentId,
    decision,
    ...(reasonRaw ? { reason: reasonRaw } : {}),
  });
  if (!parsed.success) {
    redirect(`/student/offers?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? 'Invalid response')}`);
  }

  const result = recordResponse({
    jdId: parsed.data.jdId,
    studentId: parsed.data.studentId,
    status: parsed.data.decision,
    ...(parsed.data.reason ? { reason: parsed.data.reason } : {}),
  });
  if (!result.ok) {
    redirect(`/student/offers?error=${encodeURIComponent(result.reason ?? 'No pending offer to update')}`);
  }

  // Reflect everywhere the offer surfaces — student side and the recruiter board.
  revalidatePath('/student/offers');
  revalidatePath('/student/applications');
  revalidatePath('/student');
  revalidatePath(`/recruiter/jds/${parsed.data.jdId}/offers`);
  redirect('/student/offers');
}
