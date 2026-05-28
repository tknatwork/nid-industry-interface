import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AdminShell, StatusPill, type StatusTone } from '@nid/ui';
import { HEALTH_EVENT_WEIGHTS, type HealthBand, type HealthEvent } from '@nid/core';
import { recruiterScoreDetail } from '@nid/module-admin-accountability';

export const metadata: Metadata = {
  title: 'Health score detail · Admin · NID Industry Interface',
  robots: { index: false, follow: false },
};

const EVENT_LABEL: Record<HealthEvent, string> = {
  'analyzer-flag-resolved-at-submission': 'Analyzer flag resolved at submission',
  'analyzer-flag-posted-anyway': 'Analyzer flag — posted anyway',
  'ppt-no-show': 'PPT no-show',
  'interview-slot-late-cancel': 'Interview slot cancelled < 24h',
  'post-offer-ghost': 'Post-offer ghost',
  'redressal-dismissed': 'Redressal — dismissed',
  'redressal-warning': 'Redressal — warning',
  'redressal-upheld-score-impact': 'Redressal — upheld (score impact)',
  'redressal-upheld-api-revoke': 'Redressal — upheld (API revoked)',
  'public-news-flag': 'Public-news flag',
  'cycle-completed-successfully': 'Cycle completed successfully',
  'returning-recruiter': 'Returning recruiter',
  'above-recommended-stipend': 'Above-recommended stipend',
  'peer-review-positive': 'Positive peer review',
};

export default async function HealthScoreDetail({ params }: { params: Promise<{ recruiterId: string }> }) {
  const { recruiterId } = await params;
  const detail = recruiterScoreDetail(recruiterId);
  if (!detail) notFound();

  return (
    <AdminShell activeNav="health-scores" roleLabel="Placement head · NID Ahmedabad">
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          <a href="/admin/health-scores" style={backLink}>← Health scores</a>

          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
            <div>
              <p style={label}>{detail.recruiterId}</p>
              <h1 style={{ fontSize: 'var(--fs-24)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)' }}>{detail.companyName}</h1>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 'var(--fs-48)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)', lineHeight: 1 }}>{detail.score}</p>
              <StatusPill tone={bandTone(detail.band)}>{detail.band}</StatusPill>
            </div>
          </header>

          {detail.blacklist && !detail.blacklist.lifted && (
            <p style={banner}>
              Blacklisted {fmt(detail.blacklist.addedAt)} · {detail.blacklist.cooldownMonths}-month cooldown ·{' '}
              {detail.blacklist.reason}
            </p>
          )}

          <p style={{ ...label, marginBottom: 'var(--space-3)' }}>Event ledger (most recent first)</p>
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            {detail.events.map((e, i) => {
              const w = HEALTH_EVENT_WEIGHTS[e.event];
              return (
                <div key={i} style={eventRow}>
                  <div>
                    <p style={{ fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>{EVENT_LABEL[e.event]}</p>
                    <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' }}>{fmt(e.at)}{e.note ? ` · ${e.note}` : ''}</p>
                  </div>
                  <span style={{ fontSize: 'var(--fs-16)', fontWeight: 'var(--fw-600)', color: w < 0 ? 'var(--pill-danger-fg, #b00)' : w > 0 ? 'var(--green-500)' : 'var(--text-secondary)' }}>
                    {w > 0 ? `+${w}` : w}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </AdminShell>
  );
}

function bandTone(band: HealthBand): StatusTone {
  switch (band) {
    case 'excellent':
      return 'success';
    case 'good':
      return 'info';
    case 'watch':
      return 'warning';
    case 'restricted':
      return 'danger';
    case 'blacklisted':
      return 'neutral';
  }
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const label = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' };
const backLink = { ...label, textDecoration: 'none', display: 'inline-block', marginBottom: 'var(--space-4)' };
const eventRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)', backgroundColor: 'var(--surface-card)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-2)', padding: 'var(--space-3) var(--space-4)' } as const;
const banner = { marginBottom: 'var(--space-6)', padding: 'var(--space-4)', backgroundColor: 'var(--pill-danger-bg)', color: 'var(--pill-danger-fg)', borderRadius: 'var(--radius-3)', fontWeight: 'var(--fw-600)', fontSize: 'var(--fs-14)' } as const;
