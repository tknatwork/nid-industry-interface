import type { Metadata } from 'next';
import { RecruiterShell } from '@nid/ui';
import { listForRecruiter } from '@nid/module-jd-posting';
import { listEligibleCandidates, listShortlist } from '@nid/module-candidate-browse';
import { listOffers } from '@nid/module-offer-cascade';
import { DEMO_RECRUITER } from '~/lib/demo-recruiter';

export const metadata: Metadata = {
  title: 'Analytics · Recruiter · NID Industry Interface',
  robots: { index: false, follow: false },
};

export default function RecruiterAnalyticsPage() {
  const { recruiterId, cycleId, companyName } = DEMO_RECRUITER;
  const jds = listForRecruiter(recruiterId).filter((jd) => jd.status === 'published' || jd.status === 'closed');

  const rows = jds.map((jd) => {
    const applicants = jd.targetDisciplineIds.length
      ? listEligibleCandidates({ cycleId, targetDisciplineIds: jd.targetDisciplineIds }).length
      : 0;
    const shortlisted = listShortlist(jd.id).length;
    const offers = listOffers(jd.id);
    const accepted = offers.filter((o) => o.status === 'accepted').length;
    const responded = offers.filter((o) => o.status === 'accepted' || o.status === 'declined').length;
    return {
      jd,
      applicants,
      shortlisted,
      offered: offers.length,
      accepted,
      acceptanceRate: responded > 0 ? Math.round((accepted / responded) * 100) : null,
      shortlistRate: applicants > 0 ? Math.round((shortlisted / applicants) * 100) : null,
    };
  });

  return (
    <RecruiterShell companyName={companyName}>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <header style={{ marginBottom: 'var(--space-6)' }}>
            <p style={label}>Spring 2026</p>
            <h1 style={h1}>Analytics</h1>
            <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
              Per-JD funnel for your cycle. Benchmarks are anonymised industry medians — never individual
              competitors, never student-level comparison.
            </p>
          </header>

          {rows.length === 0 ? (
            <p style={notice}>No published JDs to analyse yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--fs-14)' }}>
                <thead>
                  <tr>
                    {['JD', 'Eligible', 'Shortlisted', 'Shortlist rate', 'Offers', 'Accepted', 'Acceptance'].map((h) => (
                      <th key={h} style={th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.jd.id}>
                      <td style={{ ...td, fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>{r.jd.title}</td>
                      <td style={td}>{r.applicants}</td>
                      <td style={td}>{r.shortlisted}</td>
                      <td style={td}>{r.shortlistRate === null ? '—' : `${r.shortlistRate}%`}</td>
                      <td style={td}>{r.offered}</td>
                      <td style={td}>{r.accepted}</td>
                      <td style={td}>{r.acceptanceRate === null ? '—' : `${r.acceptanceRate}%`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ ...card, marginTop: 'var(--space-8)' }}>
            <p style={{ ...label, marginBottom: 'var(--space-2)' }}>Anonymised benchmark (illustrative)</p>
            <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)' }}>
              Industry median acceptance rate this cycle: <strong style={{ color: 'var(--text-strong)' }}>61%</strong> ·
              median time-to-offer: <strong style={{ color: 'var(--text-strong)' }}>18 days</strong>. Export (CSV / PDF/A)
              lands with the reporting slice.
            </p>
          </div>
        </div>
      </section>
    </RecruiterShell>
  );
}

const label = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' };
const h1 = { fontSize: 'var(--fs-40)', lineHeight: 'var(--lh-48)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginTop: 'var(--space-1)' };
const card = { backgroundColor: 'var(--surface-card)', border: '1px solid var(--card-border)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)' } as const;
const notice = { fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', padding: 'var(--space-6)', backgroundColor: 'var(--surface-card)', borderRadius: 'var(--radius-2)', border: '1px dashed var(--border-emphasized)', textAlign: 'center' as const };
const th = { textAlign: 'left' as const, padding: 'var(--space-2) var(--space-3)', borderBottom: '2px solid var(--border-emphasized)', fontSize: 'var(--fs-12)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', color: 'var(--text-secondary)' };
const td = { padding: 'var(--space-2) var(--space-3)', borderBottom: '1px solid var(--border-default)', color: 'var(--text-primary)' };
