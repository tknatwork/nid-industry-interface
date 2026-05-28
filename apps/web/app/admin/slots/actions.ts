'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { publishSlot } from '@nid/module-slot-booking';

export async function publishSlotAction(formData: FormData): Promise<void> {
  const input = {
    cycleId: 'cycle_spring_2026',
    day: (formData.get('day') as string | null) ?? '',
    startTime: (formData.get('startTime') as string | null) ?? '',
    endTime: (formData.get('endTime') as string | null) ?? '',
    capacity: (formData.get('capacity') as string | null) ?? '4',
  };
  const result = publishSlot(input);
  if (!result.ok) {
    redirect(`/admin/slots?error=${encodeURIComponent(result.reason ?? 'failed')}`);
  }
  revalidatePath('/admin/slots');
  redirect('/admin/slots');
}
