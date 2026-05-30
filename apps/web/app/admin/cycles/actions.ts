'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { updateCycleConfig } from '@nid/module-admin-cms';
import { windDownCycle } from '@nid/module-recruiter-onboarding';

/** The single open cycle in this demo (matches the seeded recruiter accounts). */
const CURRENT_CYCLE_ID = 'cycle_spring_2026';

/**
 * Institution-initiated wind-down of the current cycle. Locks every recruiter
 * dashboard whose active cycle is the open one and surfaces the count of
 * accounts newly locked. Company records (GST, registration, contacts) persist
 * untouched — only the dashboards lock until each recruiter re-pays to
 * reactivate for the next cycle (plan Round 3 §C). Idempotent: a second run on
 * an already-wound-down cycle locks nothing and reports `0`.
 */
export async function windDownCurrentCycleAction(): Promise<void> {
  const lockedCount = windDownCycle(CURRENT_CYCLE_ID);
  revalidatePath('/admin/cycles');
  redirect(`/admin/cycles?locked=${lockedCount}`);
}

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
