import { redirect } from 'next/navigation';
import { requireOwnedJd } from '~/lib/recruiter-jd-guard';

/**
 * Legacy per-JD shortlist route → Candidates workspace (Round 4 §A).
 *
 * The shortlist is now part of the Candidates workspace (each candidate's note lives
 * on their detail drawer). This route preserves the deep link: `requireOwnedJd` FIRST
 * (forged cross-branch id 404s before redirect), then 307 to the workspace with the
 * JD pre-selected.
 */
export default async function ShortlistRedirect({ params }: { params: Promise<{ jdId: string }> }) {
  const { jdId } = await params;
  await requireOwnedJd(jdId);
  redirect(`/recruiter/candidates?jd=${encodeURIComponent(jdId)}`);
}
