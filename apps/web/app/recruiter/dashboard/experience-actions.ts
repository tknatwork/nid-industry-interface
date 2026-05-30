'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { submitExperienceRating } from '@nid/module-recruiter-engagement';
import { isAccountLocked } from '@nid/module-recruiter-onboarding';
import { readRecruiterSession } from '~/lib/recruiter-session';

/**
 * Record the recruiter's experience rating of the placement portal (Round 4 §E).
 *
 * Recruiter-on-the-process feedback only — this is a satisfaction score for the
 * II portal, NEVER a judgement of a student, so it sidesteps the AI-as-judge /
 * ranking prohibitions entirely. There is no JD here, hence no `requireOwnedJd`:
 * the rating is keyed to the session recruiter, which we read server-side (the
 * client never supplies the recruiter id). The numeric stars arrive from the
 * `StarRating` atom's hidden input; the comment is optional.
 *
 * The dashboard already swaps its whole body for the locked panel when the
 * account is locked, so this form never renders for a locked recruiter — but the
 * mutation guards defensively anyway (mirrors the other recruiter write paths:
 * a locked recruiter who replays this POST is sent to reactivate rather than
 * writing a rating).
 */
export async function submitExperienceRatingAction(formData: FormData): Promise<void> {
  const { recruiterId } = await readRecruiterSession();

  // Cycle-lock guard (Round 3 §C): a locked recruiter can't leave a rating even
  // by replaying this POST — send them to reactivate. Mirrors the dashboard lock
  // on every recruiter write path.
  if (isAccountLocked(recruiterId)) {
    redirect('/recruiter/reactivate');
  }

  const stars = Number.parseInt((formData.get('stars') as string | null) ?? '', 10);
  const comment = (formData.get('comment') as string | null)?.trim();

  // The module's Zod schema is the authoritative validator (1..5 stars, comment
  // ≤500 chars). An out-of-range/NaN value is rejected there as a no-op; we
  // revalidate either way so a valid submit re-renders the read-only summary.
  submitExperienceRating({
    recruiterId,
    stars,
    ...(comment ? { comment } : {}),
  });

  revalidatePath('/recruiter/dashboard');
  redirect('/recruiter/dashboard');
}
