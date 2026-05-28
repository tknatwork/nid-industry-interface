'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { decidePaymentCase } from '@nid/module-admin-accountability';

export async function decidePaymentAction(formData: FormData): Promise<void> {
  const caseId = (formData.get('caseId') as string | null)?.trim() ?? '';
  const decision = (formData.get('decision') as string | null)?.trim() ?? '';
  const note = (formData.get('note') as string | null)?.trim();

  const result = decidePaymentCase({ caseId, decision, ...(note ? { note } : {}) });
  if (!result.ok) redirect(`/admin/payment-cell?error=${encodeURIComponent(result.reason ?? 'failed')}`);
  revalidatePath('/admin/payment-cell');
  redirect('/admin/payment-cell');
}
