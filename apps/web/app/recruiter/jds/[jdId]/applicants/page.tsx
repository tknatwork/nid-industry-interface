import { redirect } from 'next/navigation';
import { requireOwnedJd } from '~/lib/recruiter-jd-guard';

/**
 * Legacy per-JD applicants route → Candidates workspace (Round 4 §A).
 *
 * The old IA lived under the "JDs" tab, so working candidates here flipped the top
 * tab. The hybrid IA makes Candidates a self-contained workspace; this route now
 * only preserves the deep link. `requireOwnedJd` runs FIRST so a forged cross-branch
 * id 404s before the redirect (existence stays hidden); an owned id 307s into the
 * workspace with the JD pre-selected.
 */
export default async function ApplicantsRedirect({ params }: { params: Promise<{ jdId: string }> }) {
  const { jdId } = await params;
  await requireOwnedJd(jdId);
  redirect(`/recruiter/candidates?jd=${encodeURIComponent(jdId)}`);
}
