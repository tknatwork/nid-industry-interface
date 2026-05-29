'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { appealStudentConduct } from '@nid/module-admin-accountability';

export async function appealConductAction(formData: FormData): Promise<void> {
  const caseId = (formData.get('caseId') as string | null)?.trim() ?? '';
  const studentId = (formData.get('studentId') as string | null)?.trim() ?? '';
  const appeal = (formData.get('appeal') as string | null)?.trim() ?? '';

  const result = appealStudentConduct({ caseId, studentId, appeal });
  if (!result.ok) {
    redirect('/student/conduct?error=' + encodeURIComponent(result.reason ?? 'Could not submit your appeal.'));
  }

  revalidatePath('/admin/redressal');
  revalidatePath('/student/conduct');
  redirect('/student/conduct?sent=1');
}
