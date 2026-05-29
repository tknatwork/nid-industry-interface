import type { Metadata } from 'next';
import { PageShell, StatusPill, type StatusTone } from '@nid/ui';
import { CYCLES, type Cycle } from '~/lib/public-content';

export const metadata: Metadata = {
  title: 'Cycles · NID Industry Interface',
  description: 'Placement cycles, key dates, and eligibility.',
};

export default function CyclesPage() {
  return (
    <PageShell>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--layout-section-y)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <p style={kicker}>Two windows a year</p>
          <h1 style={h1}>Placement cycles</h1>
          <div style={{ display: 'grid', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
            {CYCLES.map((c) => (
              <a key={c.slug} href={`/cycles/${c.slug}`} style={row}>
                <div>
                  <p style={{ fontSize: 'var(--fs-20)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>{c.label}</p>
                  <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' }}>Apply opens {c.applyOpens} · interviews {c.interviewWindow}</p>
                </div>
                <StatusPill tone={tone(c.status)}>{c.status}</StatusPill>
              </a>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function tone(s: Cycle['status']): StatusTone {
  return s === 'open' ? 'success' : s === 'upcoming' ? 'info' : 'neutral';
}
const kicker = { fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-600)', color: 'var(--accent)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 'var(--space-2)' };
const h1 = { fontSize: 'var(--fs-48)', lineHeight: 'var(--lh-56)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' };
const row = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)', backgroundColor: 'var(--card-bg)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)', boxShadow: 'var(--card-shadow)', textDecoration: 'none' } as const;
