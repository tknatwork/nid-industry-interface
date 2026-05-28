'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { addToBlacklist, liftBlacklist } from '@nid/module-admin-accountability';

export async function addBlacklistAction(formData: FormData): Promise<void> {
  const recruiterId = (formData.get('recruiterId') as string | null)?.trim() ?? '';
  const reason = (formData.get('reason') as string | null)?.trim() ?? '';
  const cooldownMonths = (formData.get('cooldownMonths') as string | null) ?? '12';

  const result = addToBlacklist({ recruiterId, reason, cooldownMonths });
  if (!result.ok) redirect(`/admin/blacklist?error=${encodeURIComponent(result.reason ?? 'failed')}`);
  revalidatePath('/admin/blacklist');
  revalidatePath('/admin/health-scores');
  redirect('/admin/blacklist');
}

export async function liftBlacklistAction(formData: FormData): Promise<void> {
  const recruiterId = (formData.get('recruiterId') as string | null)?.trim() ?? '';
  const reason = (formData.get('reason') as string | null)?.trim() ?? '';

  const result = liftBlacklist({ recruiterId, reason });
  if (!result.ok) redirect(`/admin/blacklist?error=${encodeURIComponent(result.reason ?? 'failed')}`);
  revalidatePath('/admin/blacklist');
  revalidatePath('/admin/health-scores');
  redirect('/admin/blacklist');
}
