import { redirect } from 'next/navigation';
import { requireOwnedJd } from '~/lib/recruiter-jd-guard';

/**
 * Legacy per-JD candidate-detail route → Candidates workspace drawer (Round 4 §A).
 *
 * Candidate detail now opens inline in the workspace `Overlay` (it never navigates,
 * so the top tab stays on "Candidates"). This route preserves the old deep link:
 * `requireOwnedJd` FIRST (forged cross-branch id 404s before redirect), then 307 to
 * the workspace with `?jd=` + `?student=` so the drawer opens on that candidate.
 */
export default async function CandidateDetailRedirect({
  params,
}: {
  params: Promise<{ jdId: string; studentId: string }>;
}) {
  const { jdId, studentId } = await params;
  await requireOwnedJd(jdId);
  redirect(
    `/recruiter/candidates?jd=${encodeURIComponent(jdId)}&student=${encodeURIComponent(studentId)}`,
  );
}
