'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { fileRedressal } from '@nid/module-admin-accountability';

export async function fileRedressalAction(formData: FormData): Promise<void> {
  const recruiterId = (formData.get('recruiterId') as string | null)?.trim() ?? '';
  const companyName = (formData.get('companyName') as string | null)?.trim() ?? '';
  const studentLabel = (formData.get('studentLabel') as string | null)?.trim() ?? '';
  const category = (formData.get('category') as string | null)?.trim() ?? '';
  const description = (formData.get('description') as string | null)?.trim() ?? '';
  // A checkbox sends 'on' only when ticked — convert ourselves; never hand the
  // raw string to z.coerce.boolean (an unticked box is absent, but 'on' or even
  // 'false' would both coerce to true).
  const isInternship = (formData.get('isInternship') as string | null) === 'on';

  const result = fileRedressal({ recruiterId, companyName, studentLabel, category, description, isInternship });
  if (!result.ok) {
    redirect('/student/report-company?error=' + encodeURIComponent(result.reason ?? 'Could not file this report.'));
  }

  revalidatePath('/admin/redressal');
  revalidatePath('/student/report-company');
  redirect('/student/report-company?sent=1');
}
