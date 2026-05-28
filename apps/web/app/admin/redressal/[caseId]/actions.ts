'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { decideRedressal } from '@nid/module-admin-accountability';

export async function decideRedressalAction(formData: FormData): Promise<void> {
  const caseId = (formData.get('caseId') as string | null)?.trim() ?? '';
  const decision = (formData.get('decision') as string | null)?.trim() ?? '';
  const note = (formData.get('note') as string | null)?.trim();

  const result = decideRedressal({ caseId, decision, ...(note ? { note } : {}) });
  if (!result.ok) {
    redirect(`/admin/redressal/${caseId}?error=${encodeURIComponent(result.reason ?? 'failed')}`);
  }
  // The decision emits a health event, so the company's score moves — revalidate
  // both the case and the health-score surfaces.
  revalidatePath(`/admin/redressal/${caseId}`);
  revalidatePath('/admin/redressal');
  revalidatePath('/admin/health-scores');
  redirect(`/admin/redressal/${caseId}`);
}
