import type { Metadata } from 'next';
import { RecruiterAccountMenu } from '~/components/RecruiterAccountMenu';
import { RecruiterShell } from '@nid/ui';
import { JdWorkspaceSelector, type JdWorkspaceOption } from '~/components/JdWorkspaceSelector';
import { listForRecruiter } from '@nid/module-jd-posting';
import { listShortlist } from '@nid/module-candidate-browse';
import { listOffers } from '@nid/module-offer-cascade';
import { readRecruiterSession } from '~/lib/recruiter-session';
import { resolveOwnedJd } from '~/lib/recruiter-jd-guard';
import { OffersWorkspace } from './OffersWorkspace';
import { CloseJdPanel } from './CloseJdPanel';
import { closeJdAction, withdrawJdAction } from '../jds/[jdId]/close/actions';

export const metadata: Metadata = {
  title: 'Offers · Recruiter · NID Industry Interface',
  robots: { index: false, follow: false },
};

/**
 * Offers workspace (Round 4 §A/§D). A self-contained tab: pick a published JD
 * with the JdWorkspaceSelector (which swaps `?jd=` without navigating, so the
 * top tab never flips), and the selected JD's offer flow renders inline via
 * {@link OffersWorkspace}. `?panel=close` opens the close/withdraw form in an
 * Overlay drawer (never a navigation).
 *
 * Uses the NON-throwing `resolveOwnedJd` for the `?jd=` read: an unknown or
 * foreign id resolves to `null` → the empty selector renders, no 404, no leak.
 * Mutations still go through `requireOwnedJd` inside the server actions.
 *
 * The recruiter layout sets `dynamic = 'force-dynamic'`, so `?jd=`/`?panel=`/
 * `?phase=` re-render per request.
 */
export default async function OffersWorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ jd?: string; panel?: string; phase?: string; error?: string }>;
}) {
  const { recruiterId, companyName } = await readRecruiterSession();
  const { jd: jdParam, panel, error } = await searchParams;

  const published = listForRecruiter(recruiterId).filter((j) => j.status === 'published');
  const options: JdWorkspaceOption[] = published.map((j) => ({
    id: j.id,
    title: j.title,
    ...(j.location ? { location: j.location } : {}),
  }));

  const jd = await resolveOwnedJd(jdParam);

  // Close-panel data (only meaningful for a resolved JD).
  const closeData = jd
    ? (() => {
        const accepted = listOffers(jd.id).filter((o) => o.status === 'accepted');
        const acceptedIds = new Set(accepted.map((o) => o.studentId));
        const notSelected = listShortlist(jd.id).filter((s) => !acceptedIds.has(s.candidate.studentId));
        return { acceptedCount: accepted.length, notSelectedCount: notSelected.length, isPublished: jd.status === 'published' };
      })()
    : null;

  return (
    <RecruiterShell activeNav="offers" companyName={companyName} accountMenu={<RecruiterAccountMenu companyName={companyName} />}>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <header style={{ marginBottom: 'var(--space-6)' }}>
            <p style={label}>Wave-based, strict 1:1 to positions</p>
            <h1 style={h1}>Offers</h1>
            <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)', maxWidth: '60ch' }}>
              Pick a JD, lock the float sequence, issue offers in order, watch deadlines, and attach a certified offer
              letter once a student accepts. Declines and lapsed deadlines cascade to the next in sequence.
            </p>
          </header>

          <div style={{ marginBottom: 'var(--space-8)' }}>
            <JdWorkspaceSelector
              jds={options}
              basePath="/recruiter/offers"
              {...(jd ? { selectedJdId: jd.id } : {})}
            />
          </div>

          {error && (
            <p role="alert" style={errorBanner}>
              {decodeURIComponent(error)}
            </p>
          )}

          {options.length === 0 ? (
            <p style={notice}>No published JDs yet. Publish a JD to start floating offers.</p>
          ) : jd ? (
            <OffersWorkspace jd={jd} />
          ) : (
            <p style={notice}>Choose a JD above to open its offer board.</p>
          )}
        </div>
      </section>

      {jd && closeData && panel === 'close' && (
        <CloseJdPanel
          jdId={jd.id}
          jdTitle={jd.title}
          isPublished={closeData.isPublished}
          acceptedCount={closeData.acceptedCount}
          notSelectedCount={closeData.notSelectedCount}
          {...(closeData.isPublished ? {} : { statusLabel: jd.status })}
          closeJdAction={closeJdAction}
          withdrawJdAction={withdrawJdAction}
        />
      )}
    </RecruiterShell>
  );
}

const label = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' };
const h1 = { fontSize: 'var(--fs-40)', lineHeight: 'var(--lh-48)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginTop: 'var(--space-1)' };
const notice = { fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', padding: 'var(--space-6)', backgroundColor: 'var(--surface-card)', borderRadius: 'var(--radius-2)', border: '1px dashed var(--border-emphasized)', textAlign: 'center' as const };
const errorBanner = { marginBottom: 'var(--space-6)', padding: 'var(--space-4)', backgroundColor: 'var(--pill-danger-bg)', color: 'var(--pill-danger-fg)', borderRadius: 'var(--radius-3)', fontWeight: 'var(--fw-600)' } as const;
