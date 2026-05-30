import { redirect } from 'next/navigation';
import { requireOwnedJd } from '~/lib/recruiter-jd-guard';

/**
 * Legacy per-JD offers route → redirect into the Offers workspace (Round 4 §A).
 *
 * The offer board now lives on the self-contained Offers tab at
 * `/recruiter/offers?jd=<jdId>`; this old per-JD URL only redirects there so
 * deep links keep working. `requireOwnedJd` runs FIRST so a hand-typed or forged
 * cross-branch JD id 404s (existence hidden) before any redirect — the workspace
 * itself uses the non-throwing resolver and would otherwise just show the empty
 * selector, so the 404 guard belongs here on the deep-link path.
 *
 * The `actions.ts` in this folder is intentionally left in place (still imported
 * by other surfaces); only the page becomes a redirect.
 */
export default async function LegacyOffersRedirect({
  params,
}: {
  params: Promise<{ jdId: string }>;
}) {
  const { jdId } = await params;
  await requireOwnedJd(jdId);
  redirect(`/recruiter/offers?jd=${encodeURIComponent(jdId)}`);
}
