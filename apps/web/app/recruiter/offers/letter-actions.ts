'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { pushOfferLetter } from '@nid/module-offer-letters';
import { advanceStage, appendAudit, getStage, rankOf } from '@nid/module-recruiter-pipeline';
import { isAccountLocked, queueOfferLetterNotice } from '@nid/module-recruiter-onboarding';
import { readRecruiterSession } from '~/lib/recruiter-session';
import { requireOwnedJd } from '~/lib/recruiter-jd-guard';

/**
 * Group 3 — offer-letter upload action (Round 4 §D).
 *
 * The recruiter uploads a real PDF via `@nid/ui` FileUpload, which posts the raw
 * base64 in a hidden input. We push it through `offer-letters.pushOfferLetter`
 * (which validates, decodes, checksums, and mints the institute certificate),
 * then queue the delivery Outbox pair via `recruiter-onboarding`
 * (`queueOfferLetterNotice` — keeps Outbox writes in their owning module),
 * advance the pipeline to `letters-out`, and revalidate BOTH the recruiter
 * offers workspace and the student offers page (the student gains "View letter").
 *
 * Guard order mirrors the cascade actions: `requireOwnedJd` first, then the
 * account-lock guard, then mutate.
 */

/** Only the workspace-routing fields are parsed here; the heavy upload payload
 *  (base64 + size) is validated by `uploadLetterSchema` inside `pushOfferLetter`. */
const routeSchema = z.object({
  jdId: z.string().min(1),
  studentId: z.string().min(1),
  wave: z.coerce.number().int().min(1),
});

function offersWorkspaceUrl(jdId: string, opts: { error?: string; phase?: string } = {}): string {
  const params = new URLSearchParams({ jd: jdId });
  if (opts.phase !== undefined) params.set('phase', opts.phase);
  if (opts.error !== undefined) params.set('error', opts.error);
  return `/recruiter/offers?${params.toString()}`;
}

export async function pushOfferLetterAction(formData: FormData): Promise<void> {
  const route = routeSchema.safeParse({
    jdId: (formData.get('jdId') as string | null)?.trim() ?? '',
    studentId: (formData.get('studentId') as string | null)?.trim() ?? '',
    wave: (formData.get('wave') as string | null) ?? '',
  });
  // A missing/invalid routing field can't be safely redirected to a JD page —
  // fall back to the workspace root with a generic message.
  if (!route.success) {
    redirect(`/recruiter/offers?error=${encodeURIComponent('Invalid offer-letter upload.')}`);
  }
  const { jdId, studentId, wave } = route.data;

  const jd = await requireOwnedJd(jdId);
  const { recruiterId } = await readRecruiterSession();
  if (isAccountLocked(recruiterId)) redirect('/recruiter/reactivate');

  // The FileUpload atom posts the raw base64 (no data-URL prefix) under
  // `pdfBase64`, the filename under `pdfBase64FileName`, and a `sizeBytes`
  // hint. `pushOfferLetter` re-validates the true decoded size + PDF magic.
  const pdfBase64 = (formData.get('pdfBase64') as string | null) ?? '';
  const fileName = (formData.get('pdfBase64FileName') as string | null)?.trim() || 'offer-letter.pdf';
  const sizeBytes = (formData.get('sizeBytes') as string | null) ?? String(pdfBase64.length);

  if (pdfBase64.trim().length === 0) {
    redirect(offersWorkspaceUrl(jdId, { error: 'Attach a PDF offer letter before sending.', phase: 'letters' }));
  }

  const pushed = pushOfferLetter({
    jdId,
    studentId,
    wave,
    fileName,
    pdfBase64,
    sizeBytes,
    ...(jd.baseMinPaise !== undefined ? { ctcPaise: jd.baseMinPaise } : {}),
    ...(jd.stipendPaise !== undefined ? { stipendPaise: jd.stipendPaise } : {}),
  });
  if (!pushed.ok || !pushed.letter) {
    redirect(offersWorkspaceUrl(jdId, { error: pushed.reason ?? 'Could not store the offer letter.', phase: 'letters' }));
  }

  // Delivery Outbox (email + SMS) lives in recruiter-onboarding. We have no
  // student email/phone on the candidate record here, so we send the
  // institute-routed notice with the public verify path; the module writes the
  // Outbox pair (mirrors payTicketFee).
  queueOfferLetterNotice({
    recruiterId,
    jdTitle: jd.title,
    verifyPath: pushed.letter.certificate.verifyPath,
  });

  // Sending a letter advances the pipeline to its final stage `letters-out`
  // (forward-only + idempotent — a no-op if already there), then records the
  // send in the append-only audit ledger.
  if (rankOf(getStage(jdId)) < rankOf('letters-out')) {
    advanceStage(jdId, 'letters-out', recruiterId, { summary: 'Offer letter sent', studentId });
  }
  appendAudit(jdId, {
    actorRecruiterId: recruiterId,
    action: 'letter-sent',
    summary: `Sent the offer letter (wave ${wave})`,
    studentId,
    meta: { hash: pushed.letter.certificate.hash, fileName: pushed.letter.fileName },
  });

  revalidatePath('/recruiter/offers');
  revalidatePath('/student/offers');
  redirect(offersWorkspaceUrl(jdId, { phase: 'letters' }));
}
