import { redirect } from 'next/navigation';
import { requireOwnedJd } from '~/lib/recruiter-jd-guard';

/**
 * Legacy per-JD close route → redirect into the Offers workspace's close panel
 * (Round 4 §A). The close/withdraw form now opens inline in an Overlay on the
 * Offers tab at `/recruiter/offers?jd=<jdId>&panel=close`; this old URL only
 * redirects there so deep links keep working.
 *
 * `requireOwnedJd` runs FIRST so a forged/hand-typed cross-branch JD id 404s
 * before any redirect. The `actions.ts` in this folder (closeJdAction /
 * withdrawJdAction) is intentionally kept in place — the workspace's CloseJdPanel
 * imports it.
 */
export default async function LegacyCloseRedirect({
  params,
}: {
  params: Promise<{ jdId: string }>;
}) {
  const { jdId } = await params;
  await requireOwnedJd(jdId);
  redirect(`/recruiter/offers?jd=${encodeURIComponent(jdId)}&panel=close`);
}
