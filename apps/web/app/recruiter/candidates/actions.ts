'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { shortlistCandidate, unshortlistCandidate } from '@nid/module-candidate-browse';
import { getStage, rankOf } from '@nid/module-recruiter-pipeline';
import { isAccountLocked } from '@nid/module-recruiter-onboarding';
import { readRecruiterSession } from '~/lib/recruiter-session';
import { requireOwnedJd } from '~/lib/recruiter-jd-guard';

/**
 * Candidates-workspace shortlist actions (Round 4 §A).
 *
 * The old per-JD `applicants/[studentId]` page posted to `applicants/actions.ts`,
 * whose redirects target the now-removed detail route. The hybrid workspace opens
 * the candidate inline in an `Overlay`, so these siblings redirect back into the
 * workspace instead — preserving `?jd=` (and `?student=` so the drawer stays open,
 * and `?error=` so a missing-note rejection is visible in the drawer).
 *
 * Every mutation runs the same guard chain the existing recruiter actions use:
 *   1. `requireOwnedJd` FIRST — a forged cross-branch POST (JD ids are guessable)
 *      404s before any other check or mutation.
 *   2. account-lock guard — a recruiter locked between cycles is sent to
 *      `/recruiter/reactivate` even if they POST straight here.
 *   3. linearity gate — once the pipeline stage is past `shortlisting`, the
 *      shortlist is frozen; a replayed/forged POST is a no-op (the render gate
 *      hides the form, but the mutation must enforce the invariant too).
 */

const CANDIDATES_BASE = '/recruiter/candidates';

const shortlistSchema = z.object({
  jdId: z.string().trim().min(1),
  studentId: z.string().trim().min(1),
  note: z.string().trim().min(1, 'A note is required to shortlist a candidate.'),
});

const unshortlistSchema = z.object({
  jdId: z.string().trim().min(1),
  studentId: z.string().trim().min(1),
});

function workspaceUrl(jdId: string, studentId?: string, error?: string): string {
  const params = new URLSearchParams({ jd: jdId });
  if (studentId !== undefined) params.set('student', studentId);
  if (error !== undefined) params.set('error', error);
  return `${CANDIDATES_BASE}?${params.toString()}`;
}

/** True once the JD's pipeline has advanced past `shortlisting` (forward-only). */
function shortlistFrozen(jdId: string): boolean {
  return rankOf(getStage(jdId)) > rankOf('shortlisting');
}

export async function shortlistAction(formData: FormData): Promise<void> {
  const parsed = shortlistSchema.safeParse({
    jdId: formData.get('jdId'),
    studentId: formData.get('studentId'),
    note: formData.get('note'),
  });
  if (!parsed.success) {
    const jdId = (formData.get('jdId') as string | null)?.trim();
    const studentId = (formData.get('studentId') as string | null)?.trim();
    if (!jdId || !studentId) redirect('/recruiter/jds');
    await requireOwnedJd(jdId);
    const reason = parsed.error.issues[0]?.message ?? 'A note is required.';
    redirect(workspaceUrl(jdId, studentId, reason));
  }
  const { jdId, studentId, note } = parsed.data;

  await requireOwnedJd(jdId);

  const { recruiterId } = await readRecruiterSession();
  if (isAccountLocked(recruiterId)) redirect('/recruiter/reactivate');

  if (shortlistFrozen(jdId)) {
    // Stage-gate: interviews are underway, the shortlist is read-only. No-op.
    redirect(workspaceUrl(jdId, studentId));
  }

  const result = shortlistCandidate({ jdId, studentId, note });
  if (!result.ok) {
    redirect(workspaceUrl(jdId, studentId, result.reason ?? 'failed'));
  }
  revalidatePath(CANDIDATES_BASE);
  redirect(workspaceUrl(jdId, studentId));
}

export async function unshortlistAction(formData: FormData): Promise<void> {
  const parsed = unshortlistSchema.safeParse({
    jdId: formData.get('jdId'),
    studentId: formData.get('studentId'),
  });
  if (!parsed.success) redirect('/recruiter/jds');
  const { jdId, studentId } = parsed.data;

  await requireOwnedJd(jdId);

  const { recruiterId } = await readRecruiterSession();
  if (isAccountLocked(recruiterId)) redirect('/recruiter/reactivate');

  if (shortlistFrozen(jdId)) {
    redirect(workspaceUrl(jdId, studentId));
  }

  unshortlistCandidate(jdId, studentId);
  revalidatePath(CANDIDATES_BASE);
  redirect(workspaceUrl(jdId, studentId));
}
