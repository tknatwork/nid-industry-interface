'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { setCycleOptIn } from '@nid/module-student-portal';

export async function toggleOptInAction(formData: FormData): Promise<void> {
  const studentId = (formData.get('studentId') as string | null)?.trim() ?? '';
  const cycleId = (formData.get('cycleId') as string | null)?.trim() ?? '';
  // Convert to a real boolean — z.coerce.boolean('false') is truthy, so we must
  // not hand the schema the raw string.
  const optedIn = (formData.get('optedIn') as string | null) === 'true';

  setCycleOptIn({ studentId, cycleId, optedIn });
  revalidatePath('/student/cycles');
  revalidatePath('/student');
  revalidatePath('/student/jds');
  redirect('/student/cycles');
}
