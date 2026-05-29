import type { Metadata } from 'next';
import { RecruiterShell, StatusPill, type StatusTone } from '@nid/ui';
import { listForRecruiter } from '@nid/module-jd-posting';
import { listOffers } from '@nid/module-offer-cascade';
import { listEligibleCandidates, listShortlist } from '@nid/module-candidate-browse';
import { recruiterScoreDetail, type HealthEventRecord } from '@nid/module-admin-accountability';
import { readRecruiterSession } from '~/lib/recruiter-session';

export const metadata: Metadata = {
  title: 'Your stats · Recruiter · NID Industry Interface',
  robots: { index: false, follow: false },
};

export default async function RecruiterStatsPage() {
  // Read the recruiter through the session helper (like dashboard + profile) so
  // when real auth lands only recruiter-session.ts changes — not every page.
  const { recruiterId, cycleId, companyName } = await readRecruiterSession();
  const detail = recruiterScoreDetail(recruiterId);

  const jds = listForRecruiter(recruiterId);
  const allOffers = jds.flatMap((jd) => listOffers(jd.id));
  const accepted = allOffers.filter((o) => o.status === 'accepted').length;
  const responded = allOffers.filter((o) => o.status === 'accepted' || o.status === 'declined').length;
  const acceptanceRate = responded > 0 ? Math.round((accepted / responded) * 100) : null;

  const funnelRows = jds
    .filter((jd) => jd.status === 'published' || jd.status === 'closed')
    .map((jd) => {
      const applicants = jd.targetDisciplineIds.length
        ? listEligibleCandidates({ cycleId, targetDisciplineIds: jd.targetDisciplineIds }).length
        : 0;
      const shortlisted = listShortlist(jd.id).length;
      const offers = listOffers(jd.id);
      const jdAccepted = offers.filter((o) => o.status === 'accepted').length;
      const jdResponded = offers.filter((o) => o.status === 'accepted' || o.status === 'declined').length;
      return {
        jd,
        applicants,
        shortlisted,
        offered: offers.length,
        accepted: jdAccepted,
        acceptanceRate: jdResponded > 0 ? Math.round((jdAccepted / jdResponded) * 100) : null,
        shortlistRate: applicants > 0 ? Math.round((shortlisted / applicants) * 100) : null,
      };
    });

  const signalCount = (e: HealthEventRecord['event']): number =>
    detail ? detail.events.filter((x) => x.event === e).length : 0;

  return (
    <RecruiterShell activeNav="stats" companyName={companyName}>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
            <div>
              <p style={label}>{companyName} · member since Aug 2021</p>
              <h1 style={h1}>Your stats with NID</h1>
              <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
                NID watches and remembers. This is what the placement cell sees — and a deep-link to what
                students and peer recruiters see about you.
              </p>
            </div>
            {detail && (
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 'var(--fs-48)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)', lineHeight: 1 }}>{detail.score}</p>
                <StatusPill tone={bandTone(detail.band)}>{detail.band} band</StatusPill>
              </div>
            )}
          </header>

          <p style={{ ...label, marginBottom: 'var(--space-3)' }}>Lifetime with NID</p>
          <div style={statGrid}>
            <Stat label="Cycles participated" value={7} />
            <Stat label="JDs posted" value={jds.length} />
            <Stat label="Offers extended" value={allOffers.length} />
            <Stat label="Hires (accepted)" value={accepted} />
            <Stat label="Acceptance rate" value={acceptanceRate === null ? '—' : `${acceptanceRate}%`} />
          </div>

          <p style={{ ...label, margin: 'var(--space-8) 0 var(--space-3)' }}>Conduct signals (last 5 years)</p>
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            <SignalRow label="AI-analyzer flags resolved at submission" value={signalCount('analyzer-flag-resolved-at-submission')} good />
            <SignalRow label="AI-analyzer flags posted anyway" value={signalCount('analyzer-flag-posted-anyway')} />
            <SignalRow label="Student redressal cases (upheld)" value={signalCount('redressal-upheld-score-impact') + signalCount('redressal-upheld-api-revoke')} />
            <SignalRow label="PPT no-shows" value={signalCount('ppt-no-show')} />
            <SignalRow label="Post-offer ghost incidents" value={signalCount('post-offer-ghost')} />
            <SignalRow label="Successful cycle completions" value={signalCount('cycle-completed-successfully')} good />
          </div>

          <div style={{ ...card, marginTop: 'var(--space-8)' }}>
            <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-strong)' }}>
              Your public reputation surface — what students and peer recruiters see:
            </p>
            <a href={`/r/${slug(companyName)}/transparency`} style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 'var(--fw-600)', fontSize: 'var(--fs-14)' }}>
              View /r/{slug(companyName)}/transparency →
            </a>
          </div>

          <p style={{ ...label, margin: 'var(--space-10) 0 var(--space-2)' }}>Per-JD funnel · this cycle</p>
          <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
            How each published JD moved through eligibility, shortlist and offers. Benchmarks are anonymised
            industry medians — never individual competitors, never student-level comparison.
          </p>
          {funnelRows.length === 0 ? (
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
                  {funnelRows.map((r) => (
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

          <div style={{ ...card, marginTop: 'var(--space-6)' }}>
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

function Stat({ label: l, value }: { label: string; value: string | number }) {
  return (
    <div style={card}>
      <p style={{ fontSize: 'var(--fs-24)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)', lineHeight: 1 }}>{value}</p>
      <p style={{ ...label, marginTop: 'var(--space-1)' }}>{l}</p>
    </div>
  );
}

function SignalRow({ label: l, value, good }: { label: string; value: number; good?: boolean }) {
  const tone: StatusTone = value === 0 ? 'neutral' : good ? 'success' : 'warning';
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)', backgroundColor: 'var(--surface-card)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-2)', padding: 'var(--space-3) var(--space-4)' }}>
      <span style={{ fontSize: 'var(--fs-14)', color: 'var(--text-strong)' }}>{l}</span>
      <StatusPill tone={tone}>{value}</StatusPill>
    </div>
  );
}

function bandTone(band: string): StatusTone {
  return band === 'excellent' ? 'success' : band === 'good' ? 'info' : band === 'watch' ? 'warning' : band === 'restricted' ? 'danger' : 'neutral';
}
function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const label = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' };
const h1 = { fontSize: 'var(--fs-40)', lineHeight: 'var(--lh-48)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginTop: 'var(--space-1)' };
const card = { backgroundColor: 'var(--surface-card)', border: '1px solid var(--card-border)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)' } as const;
const statGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--space-3)' } as const;
const notice = { fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', padding: 'var(--space-6)', backgroundColor: 'var(--surface-card)', borderRadius: 'var(--radius-2)', border: '1px dashed var(--border-emphasized)', textAlign: 'center' as const };
const th = { textAlign: 'left' as const, padding: 'var(--space-2) var(--space-3)', borderBottom: '2px solid var(--border-emphasized)', fontSize: 'var(--fs-12)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', color: 'var(--text-secondary)' };
const td = { padding: 'var(--space-2) var(--space-3)', borderBottom: '1px solid var(--border-default)', color: 'var(--text-primary)' };
