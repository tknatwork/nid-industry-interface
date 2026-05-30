import { redirect } from 'next/navigation';
import { requireOwnedJd } from '~/lib/recruiter-jd-guard';

/**
 * Legacy per-JD interview route → Interviews workspace redirect (Round 4 §A).
 *
 * The Before/During/After interview surface now lives at the canonical
 * `/recruiter/interviews?jd=<jdId>` workspace under the **Interviews** top tab.
 * This route is kept only so existing deep links keep working: it confirms the
 * session recruiter owns the JD (foreign/guessable ids 404 via `requireOwnedJd`,
 * never leaking existence), then 307-redirects into the workspace.
 *
 * Collapsing this page also fixes the long-standing tab-identity bug: the old
 * implementation rendered `RecruiterShell activeNav="jds"`, so opening an
 * interview flipped the top tab to "JDs". The workspace it redirects to uses
 * `activeNav="interviews"`.
 */
export default async function LegacyInterviewRedirect({
  params,
}: {
  params: Promise<{ jdId: string }>;
}) {
  const { jdId } = await params;
  await requireOwnedJd(jdId);
  redirect(`/recruiter/interviews?jd=${encodeURIComponent(jdId)}`);
}
