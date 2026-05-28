import type { Metadata } from 'next';
import { AdminShell, StatusPill, type StatusTone } from '@nid/ui';
import { listRecruiterScores, type RecruiterScore } from '@nid/module-admin-accountability';

export const metadata: Metadata = {
  title: 'Health scores · Admin · NID Industry Interface',
  robots: { index: false, follow: false },
};

export default function HealthScoresPage() {
  const scores = listRecruiterScores();
  const dist = scores.reduce<Record<string, number>>((acc, s) => {
    acc[s.band] = (acc[s.band] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <AdminShell activeNav="health-scores" roleLabel="Placement head · NID Ahmedabad">
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <header style={{ marginBottom: 'var(--space-6)' }}>
            <p style={label}>Accountability</p>
            <h1 style={h1}>Company health scores</h1>
            <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
              A transparent, non-predictive sum of past behaviour (Phase 5.11). Worst first. Click a company for its
              event ledger.
            </p>
          </header>

          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
            {(['excellent', 'good', 'watch', 'restricted', 'blacklisted'] as const).map((b) => (
              <span key={b} style={{ display: 'inline-flex', gap: 'var(--space-2)', alignItems: 'center', fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' }}>
                <StatusPill tone={bandTone(b)}>{b}</StatusPill> {dist[b] ?? 0}
              </span>
            ))}
          </div>

          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            {scores.map((s) => (
              <a key={s.recruiterId} href={`/admin/health-scores/${s.recruiterId}`} style={rowCard}>
                <div>
                  <p style={{ fontSize: 'var(--fs-16)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>
                    {s.companyName} {s.blacklisted && <span style={{ color: 'var(--pill-danger-fg, #b00)', fontSize: 'var(--fs-12)' }}>· blacklisted</span>}
                  </p>
                  <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' }}>{s.recruiterId} · {s.eventCount} events</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <span style={{ fontSize: 'var(--fs-24)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)' }}>{s.score}</span>
                  <StatusPill tone={bandTone(s.band)}>{s.band}</StatusPill>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </AdminShell>
  );
}

export function bandTone(band: RecruiterScore['band']): StatusTone {
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

const label = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' };
const h1 = { fontSize: 'var(--fs-40)', lineHeight: 'var(--lh-48)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginTop: 'var(--space-1)' };
const rowCard = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)', backgroundColor: 'var(--surface-card)', border: '1px solid var(--card-border)', borderRadius: 'var(--card-radius)', padding: 'var(--space-4) var(--card-padding)', textDecoration: 'none' } as const;
