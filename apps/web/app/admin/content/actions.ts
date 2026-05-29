'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { updateContentBlock } from '@nid/module-admin-cms';

export async function updateContentBlockAction(formData: FormData): Promise<void> {
  const slot = (formData.get('slot') as string | null)?.trim() ?? '';
  const result = updateContentBlock({
    slot,
    title: (formData.get('title') as string | null)?.trim() ?? '',
    body: (formData.get('body') as string | null)?.trim() ?? '',
  });
  if (!result.ok) redirect(`/admin/content?error=${encodeURIComponent(result.reason ?? 'failed')}`);
  revalidatePath('/admin/content');
  redirect(`/admin/content?saved=${encodeURIComponent(slot)}`);
}
