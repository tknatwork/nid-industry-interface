'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { revokeApiKey } from '@nid/module-admin-accountability';

export async function revokeApiKeyAction(formData: FormData): Promise<void> {
  const keyId = (formData.get('keyId') as string | null)?.trim() ?? '';
  const reason = (formData.get('reason') as string | null)?.trim() ?? '';

  const result = revokeApiKey({ keyId, reason });
  if (!result.ok) redirect(`/admin/api-keys?error=${encodeURIComponent(result.reason ?? 'failed')}`);
  revalidatePath('/admin/api-keys');
  redirect('/admin/api-keys');
}
