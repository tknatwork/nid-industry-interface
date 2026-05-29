'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { decideStudentConduct } from '@nid/module-admin-accountability';

export async function decideConductAction(formData: FormData): Promise<void> {
  const caseId = (formData.get('caseId') as string | null)?.trim() ?? '';
  const decision = (formData.get('decision') as string | null)?.trim() ?? '';
  const note = (formData.get('note') as string | null)?.trim();

  const result = decideStudentConduct({ caseId, decision, ...(note ? { note } : {}) });
  if (!result.ok) redirect(`/admin/student-conduct?error=${encodeURIComponent(result.reason ?? 'failed')}`);
  revalidatePath('/admin/student-conduct');
  redirect('/admin/student-conduct');
}
