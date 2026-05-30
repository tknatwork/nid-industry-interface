'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  autoFloatNext,
  issueOffer,
  listOffers,
  lockFloatSequence,
  recordResponse,
  simulateDeadlinePassed,
  sweepExpiredOffers,
} from '@nid/module-offer-cascade';
import { getInterviewsComplete, listSelected } from '@nid/module-interview-console';
import { advanceStage, appendAudit, getStage, rankOf } from '@nid/module-recruiter-pipeline';
import { isAccountLocked } from '@nid/module-recruiter-onboarding';
import { readRecruiterSession } from '~/lib/recruiter-session';
import { requireOwnedJd } from '~/lib/recruiter-jd-guard';

/**
 * Group 3 — Offers workspace server actions (Round 4 §D).
 *
 * Every action follows the same gated shape, mirroring the legacy
 * `jds/[jdId]/offers/actions.ts`:
 *   1. `await requireOwnedJd(jdId)` FIRST — a forged cross-branch POST (JD ids
 *      are sequential, hence guessable) 404s before any other check or mutation.
 *   2. Account-lock guard — a recruiter locked between cycles is redirected to
 *      `/recruiter/reactivate` instead of mutating.
 *   3. The relevant linearity / interviews-complete gate.
 *   4. Mutate, then `revalidatePath` + `redirect` back to the workspace,
 *      preserving `?jd=` (and `?phase=` where the caller set it).
 *
 * The workspace lives at `/recruiter/offers?jd=<jdId>`; redirects always return
 * there so the top tab never flips to "JDs".
 */

/** Build the canonical workspace return URL, optionally carrying an error + phase. */
function offersWorkspaceUrl(jdId: string, opts: { error?: string; phase?: string } = {}): string {
  const params = new URLSearchParams({ jd: jdId });
  if (opts.phase !== undefined) params.set('phase', opts.phase);
  if (opts.error !== undefined) params.set('error', opts.error);
  return `/recruiter/offers?${params.toString()}`;
}

/** Account-lock guard shared by every mutation here (redirect throws). */
async function assertNotLocked(): Promise<{ recruiterId: string }> {
  const { recruiterId } = await readRecruiterSession();
  if (isAccountLocked(recruiterId)) redirect('/recruiter/reactivate');
  return { recruiterId };
}

/**
 * Lock the recruiter's float order (Round 4 §D). The drag-built order arrives as
 * a single repeated `order` field. `lockFloatSequence` validates it equals the
 * After-selected set; on success we advance the pipeline to `offer-sequencing`
 * (forward-only — a no-op if already past it) and audit the lock.
 */
export async function lockSequenceAction(formData: FormData): Promise<void> {
  const jdId = (formData.get('jdId') as string | null)?.trim() ?? '';

  await requireOwnedJd(jdId);
  const { recruiterId } = await assertNotLocked();

  // Linearity: a sequence may only be locked once interviews are complete (the
  // Offers unlock). A forged POST before that is refused, not mutated.
  if (!getInterviewsComplete(jdId)) {
    redirect(offersWorkspaceUrl(jdId, { error: 'Mark interviews complete before locking a sequence.' }));
  }

  const order = formData
    .getAll('order')
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .filter((v) => v.length > 0);

  const selectedIds = listSelected(jdId).map((p) => p.studentId);
  const result = lockFloatSequence({ jdId, order }, selectedIds);
  if (!result.ok) {
    redirect(offersWorkspaceUrl(jdId, { error: result.reason ?? 'Could not lock the sequence.' }));
  }

  // Advance the linear pipeline (forward-only) + record the lock in the audit.
  if (rankOf(getStage(jdId)) < rankOf('offer-sequencing')) {
    advanceStage(jdId, 'offer-sequencing', recruiterId, { summary: 'Float sequence locked' });
  }
  appendAudit(jdId, {
    actorRecruiterId: recruiterId,
    action: 'stage-advanced',
    summary: `Locked the float order (${order.length} candidate${order.length === 1 ? '' : 's'})`,
  });

  revalidatePath('/recruiter/offers');
  redirect(offersWorkspaceUrl(jdId));
}

/**
 * Issue one offer to the next-in-sequence candidate. The cascade rules
 * (`issueOffer`) enforce the position cap AND, once a sequence is locked,
 * strict in-order issuance — an out-of-sequence POST is refused there.
 */
export async function issueOfferAction(formData: FormData): Promise<void> {
  const jdId = (formData.get('jdId') as string | null)?.trim() ?? '';
  const studentId = (formData.get('studentId') as string | null)?.trim() ?? '';
  const ctcPaise = (formData.get('ctcPaise') as string | null) ?? undefined;
  const stipendPaise = (formData.get('stipendPaise') as string | null) ?? undefined;

  const jd = await requireOwnedJd(jdId);
  await assertNotLocked();

  // Server-side unlock gate (mirrors the render gate): no offer before complete.
  if (!getInterviewsComplete(jdId)) {
    redirect(offersWorkspaceUrl(jdId, { error: 'Mark interviews complete before issuing offers.' }));
  }

  // Cap-bearing inputs are derived SERVER-SIDE, never trusted from the client:
  // `positions` is the owned JD's vacancy count; `shortlistRemaining` is the
  // After-selected pool minus those already offered (what autoFloatNext computes).
  const offered = new Set(listOffers(jdId).map((o) => o.studentId));
  const shortlistRemaining = listSelected(jdId)
    .map((p) => p.studentId)
    .filter((id) => !offered.has(id)).length;

  const result = issueOffer({
    jdId,
    studentId,
    positions: jd.positions,
    shortlistRemaining,
    ...(ctcPaise ? { ctcPaise } : {}),
    ...(stipendPaise ? { stipendPaise } : {}),
  });
  if (!result.ok) {
    redirect(offersWorkspaceUrl(jdId, { error: result.reason ?? 'Could not issue the offer.' }));
  }

  revalidatePath('/recruiter/offers');
  redirect(offersWorkspaceUrl(jdId));
}

/**
 * Record a student response (accept / decline — demo control). On any recorded
 * response we sweep lapsed deadlines then auto-float the next in sequence to
 * backfill reopened slots within the cap (Round 4 §D "sweep + auto-float").
 */
export async function respondAction(formData: FormData): Promise<void> {
  const jdId = (formData.get('jdId') as string | null)?.trim() ?? '';
  const studentId = (formData.get('studentId') as string | null)?.trim() ?? '';
  const status = (formData.get('status') as string | null)?.trim() ?? '';

  const jd = await requireOwnedJd(jdId);
  await assertNotLocked();

  const result = recordResponse({ jdId, studentId, status, reason: 'student response (demo)' });
  if (!result.ok) {
    redirect(offersWorkspaceUrl(jdId, { error: result.reason ?? 'No pending offer to update.' }));
  }

  // Sweep any lapsed deadlines, then float the next-in-sequence to fill the slot
  // a decline/expire just reopened — never exceeding the position cap.
  sweepExpiredOffers(jdId);
  autoFloatNext(jdId, jd.positions, listSelected(jdId).map((p) => p.studentId));

  revalidatePath('/recruiter/offers');
  revalidatePath('/student/offers');
  redirect(offersWorkspaceUrl(jdId));
}

/**
 * Demo control: force a pending offer's deadline to lapse now, then sweep +
 * auto-float — so the decline/timeout → cascade path can be exercised without
 * waiting out a real 48h window.
 */
export async function simulateDeadlineAction(formData: FormData): Promise<void> {
  const jdId = (formData.get('jdId') as string | null)?.trim() ?? '';
  const studentId = (formData.get('studentId') as string | null)?.trim() ?? '';

  const jd = await requireOwnedJd(jdId);
  await assertNotLocked();

  const result = simulateDeadlinePassed({ jdId, studentId });
  if (!result.ok) {
    redirect(offersWorkspaceUrl(jdId, { error: result.reason ?? 'No pending offer to expire.' }));
  }

  autoFloatNext(jdId, jd.positions, listSelected(jdId).map((p) => p.studentId));

  revalidatePath('/recruiter/offers');
  revalidatePath('/student/offers');
  redirect(offersWorkspaceUrl(jdId));
}

/**
 * Manual "sweep & float next" — evaluate lapsed deadlines lazily (no scheduler)
 * and float the next-in-sequence to backfill open slots within the cap.
 */
export async function sweepAndFloatAction(formData: FormData): Promise<void> {
  const jdId = (formData.get('jdId') as string | null)?.trim() ?? '';

  const jd = await requireOwnedJd(jdId);
  await assertNotLocked();

  sweepExpiredOffers(jdId);
  autoFloatNext(jdId, jd.positions, listSelected(jdId).map((p) => p.studentId));

  revalidatePath('/recruiter/offers');
  revalidatePath('/student/offers');
  redirect(offersWorkspaceUrl(jdId));
}
