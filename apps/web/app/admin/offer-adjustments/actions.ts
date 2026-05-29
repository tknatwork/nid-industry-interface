'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { decideOfferAdjustment } from '@nid/module-admin-accountability';

export async function decideAdjustmentAction(formData: FormData): Promise<void> {
  const caseId = (formData.get('caseId') as string | null)?.trim() ?? '';
  const decision = (formData.get('decision') as string | null)?.trim() ?? '';
  const note = (formData.get('note') as string | null)?.trim();

  const result = decideOfferAdjustment({ caseId, decision, ...(note ? { note } : {}) });
  if (!result.ok) redirect(`/admin/offer-adjustments?error=${encodeURIComponent(result.reason ?? 'failed')}`);
  revalidatePath('/admin/offer-adjustments');
  revalidatePath('/admin/health-scores');
  redirect('/admin/offer-adjustments');
}
