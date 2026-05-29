'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { publishMeetingSlot, publishPptWindow } from '@nid/module-recruiter-engagement';

export async function publishPptWindowAction(formData: FormData): Promise<void> {
  const result = publishPptWindow({
    cycleId: (formData.get('cycleId') as string | null)?.trim() ?? 'cycle_spring_2026',
    day: (formData.get('day') as string | null)?.trim() ?? '',
    startTime: (formData.get('startTime') as string | null)?.trim() ?? '',
    endTime: (formData.get('endTime') as string | null)?.trim() ?? '',
    mode: (formData.get('mode') as string | null)?.trim() ?? '',
    campus: (formData.get('campus') as string | null)?.trim() ?? '',
  });
  if (!result.ok) redirect(`/admin/engagement?error=${encodeURIComponent(result.reason ?? 'failed')}`);
  revalidatePath('/admin/engagement');
  revalidatePath('/recruiter/ppt');
  redirect('/admin/engagement');
}

export async function publishMeetingSlotAction(formData: FormData): Promise<void> {
  const result = publishMeetingSlot({
    placementHead: (formData.get('placementHead') as string | null)?.trim() ?? '',
    campus: (formData.get('campus') as string | null)?.trim() ?? '',
    day: (formData.get('day') as string | null)?.trim() ?? '',
    time: (formData.get('time') as string | null)?.trim() ?? '',
  });
  if (!result.ok) redirect(`/admin/engagement?error=${encodeURIComponent(result.reason ?? 'failed')}`);
  revalidatePath('/admin/engagement');
  revalidatePath('/recruiter/meetings');
  redirect('/admin/engagement');
}
