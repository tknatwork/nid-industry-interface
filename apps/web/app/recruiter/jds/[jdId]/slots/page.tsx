import { redirect } from 'next/navigation';
import { requireOwnedJd } from '~/lib/recruiter-jd-guard';

/**
 * Legacy per-JD slots route → Interviews workspace redirect (Round 4 §A).
 *
 * Slot arrangement is now part of the Before phase of the canonical
 * `/recruiter/interviews?jd=<jdId>` workspace (the "Lego" timeline). This route
 * is kept only so existing deep links keep working: it confirms the session
 * recruiter owns the JD (foreign/guessable ids 404 via `requireOwnedJd`), then
 * 307-redirects into the workspace.
 *
 * The slot-booking server action (`./actions.ts`) stays in place — it is still
 * imported by the surfaces that mutate slot assignments.
 */
export default async function LegacySlotsRedirect({
  params,
}: {
  params: Promise<{ jdId: string }>;
}) {
  const { jdId } = await params;
  await requireOwnedJd(jdId);
  redirect(`/recruiter/interviews?jd=${encodeURIComponent(jdId)}`);
}
