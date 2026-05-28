'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  advance,
  recruiterStatusSchema,
  type RecruiterStatus,
} from '@nid/module-recruiter-onboarding';

const VALID_TRANSITIONS: Readonly<Record<RecruiterStatus, readonly RecruiterStatus[]>> = {
  'application-received': ['verification-pending', 'rejected'],
  'verification-pending': ['fee-due', 'rejected'],
  'fee-due': ['payment-received'],
  'payment-received': ['approved'],
  'approved': ['credentials-issued'],
  'credentials-issued': [],
  'rejected': [],
};

export async function advanceTokenAction(formData: FormData): Promise<void> {
  const tokenId = (formData.get('tokenId') as string | null)?.trim().toUpperCase();
  const fromStatusRaw = formData.get('fromStatus') as string | null;
  const toStatusRaw = formData.get('toStatus') as string | null;
  const note = (formData.get('note') as string | null)?.trim() ?? undefined;
  const feeRaw = formData.get('feeAmountPaise') as string | null;

  if (!tokenId || !fromStatusRaw || !toStatusRaw) {
    redirect('/admin/recruiters/queue?error=missing');
  }

  const fromStatus = recruiterStatusSchema.safeParse(fromStatusRaw);
  const toStatus = recruiterStatusSchema.safeParse(toStatusRaw);
  if (!fromStatus.success || !toStatus.success) {
    redirect(`/admin/recruiters/${tokenId}?error=invalid-status`);
  }
  const allowed = VALID_TRANSITIONS[fromStatus.data];
  if (!allowed.includes(toStatus.data)) {
    redirect(`/admin/recruiters/${tokenId}?error=illegal-transition`);
  }

  const feeAmountPaise = feeRaw && feeRaw.length > 0 ? Number(feeRaw) : undefined;

  const updated = advance({
    tokenId,
    toStatus: toStatus.data,
    note: note && note.length > 0 ? note : undefined,
    feeAmountPaise: feeAmountPaise !== undefined && Number.isFinite(feeAmountPaise) ? feeAmountPaise : undefined,
  });

  if (!updated) {
    redirect(`/admin/recruiters/${tokenId}?error=not-found`);
  }

  // Refresh both surfaces that depend on the updated record.
  revalidatePath('/admin/recruiters/queue');
  revalidatePath(`/admin/recruiters/${tokenId}`);
  revalidatePath(`/track/${tokenId}`);

  redirect(`/admin/recruiters/${tokenId}`);
}
