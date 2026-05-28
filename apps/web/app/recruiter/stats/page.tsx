import type { Metadata } from 'next';
import { RecruiterShell, StatusPill, type StatusTone } from '@nid/ui';
import { listForRecruiter } from '@nid/module-jd-posting';
import { listOffers } from '@nid/module-offer-cascade';
import { recruiterScoreDetail, type HealthEventRecord } from '@nid/module-admin-accountability';
import { DEMO_RECRUITER } from '~/lib/demo-recruiter';

export const metadata: Metadata = {
  title: 'Your stats · Recruiter · NID Industry Interface',
  robots: { index: false, follow: false },
};

export default function RecruiterStatsPage() {
  const { recruiterId, companyName } = DEMO_RECRUITER;
  const detail = recruiterScoreDetail(recruiterId);

  const jds = listForRecruiter(recruiterId);
  const allOffers = jds.flatMap((jd) => listOffers(jd.id));
  const accepted = allOffers.filter((o) => o.status === 'accepted').length;
  const responded = allOffers.filter((o) => o.status === 'accepted' || o.status === 'declined').length;
  const acceptanceRate = responded > 0 ? Math.round((accepted / responded) * 100) : null;

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
