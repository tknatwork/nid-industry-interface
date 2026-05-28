'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { setTransportMode, type TransportMode } from '@nid/module-interview-console';
import { DEMO_RECRUITER } from '~/lib/demo-recruiter';

export async function setTransportAction(formData: FormData): Promise<void> {
  const jdId = (formData.get('jdId') as string | null)?.trim() ?? '';
  const mode = (formData.get('mode') as string | null)?.trim();
  if (mode === 'live' || mode === 'periodic' || mode === 'manual') {
    setTransportMode(DEMO_RECRUITER.recruiterId, mode as TransportMode);
  }
  revalidatePath(`/recruiter/jds/${jdId}/interviews`);
  redirect(`/recruiter/jds/${jdId}/interviews`);
}
