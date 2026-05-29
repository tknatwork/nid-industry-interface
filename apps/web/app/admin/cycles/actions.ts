'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { updateCycleConfig } from '@nid/module-admin-cms';

export async function updateCycleConfigAction(formData: FormData): Promise<void> {
  const result = updateCycleConfig({
    cycleId: (formData.get('cycleId') as string | null)?.trim() ?? '',
    label: (formData.get('label') as string | null)?.trim() ?? '',
    status: (formData.get('status') as string | null)?.trim() ?? '',
    feeRupees: (formData.get('feeRupees') as string | null) ?? '0',
    applyOpens: (formData.get('applyOpens') as string | null)?.trim() ?? '',
    jdDeadline: (formData.get('jdDeadline') as string | null)?.trim() ?? '',
    browseOpens: (formData.get('browseOpens') as string | null)?.trim() ?? '',
    interviewWindow: (formData.get('interviewWindow') as string | null)?.trim() ?? '',
    offerBy: (formData.get('offerBy') as string | null)?.trim() ?? '',
  });
  if (!result.ok) redirect(`/admin/cycles?error=${encodeURIComponent(result.reason ?? 'failed')}`);
  revalidatePath('/admin/cycles');
  redirect('/admin/cycles?saved=1');
}
