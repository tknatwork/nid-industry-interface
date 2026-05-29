import type { Metadata } from 'next';
import { PageShell } from '@nid/ui';
import { PAST_RECRUITERS, type PastRecruiter } from '~/lib/recruiter-public';

export const metadata: Metadata = {
  title: 'Past recruiters · NID Industry Interface',
  description: 'Organisations that have recruited from NID over the last five years, grouped by sector.',
};

function groupBySector(rows: readonly PastRecruiter[]): readonly { sector: string; companies: readonly PastRecruiter[] }[] {
  const map = new Map<string, PastRecruiter[]>();
  for (const r of rows) {
    const bucket = map.get(r.sector) ?? [];
    bucket.push(r);
    map.set(r.sector, bucket);
  }
  return [...map.entries()]
    .map(([sector, companies]) => ({
      sector,
      companies: [...companies].sort((a, b) => b.year - a.year),
    }))
    .sort((a, b) => a.sector.localeCompare(b.sector));
}

export default function PastRecruitersPage() {
  const groups = groupBySector(PAST_RECRUITERS);

  return (
    <PageShell>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--layout-section-y)' }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
          <a href="/recruiters" style={back}>← For recruiters</a>
          <p style={kicker}>Track record</p>
          <h1 style={h1}>Past recruiters</h1>
          <p style={lede}>
            A selection of organisations that have recruited NID design graduates. Listing here is descriptive, not an
            endorsement or a guarantee of future participation.
          </p>
          <p style={note}>Showing the last 5 years (2021–2026), grouped by sector.</p>

          <div style={{ display: 'grid', gap: 'var(--space-10)', marginTop: 'var(--space-8)' }}>
            {groups.map((g) => (
              <div key={g.sector}>
                <h2 style={h2}>{g.sector}</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                  {g.companies.map((c) => (
                    <div key={`${c.name}-${c.year}`} style={tile}>
                      <p style={tileName}>{c.name}</p>
                      <p style={tileYear}>Recruited {c.year}</p>
                      <p style={tileDisc}>{c.disciplines.join(' · ')}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}

const back = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', textDecoration: 'none', display: 'inline-block', marginBottom: 'var(--space-4)' };
const kicker = { fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-600)', color: 'var(--accent)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 'var(--space-2)' };
const h1 = { fontSize: 'var(--fs-48)', lineHeight: 'var(--lh-56)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginBottom: 'var(--space-4)' };
const lede = { fontSize: 'var(--fs-18)', lineHeight: 'var(--lh-30)', fontWeight: 'var(--fw-300)', color: 'var(--text-primary)', maxWidth: '680px' };
const note = { fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', marginTop: 'var(--space-4)' };
const h2 = { fontSize: 'var(--fs-20)', lineHeight: 'var(--lh-28)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)', textTransform: 'uppercase' as const, letterSpacing: '0.04em' };
const tile = { display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '92px', backgroundColor: 'var(--surface-panel)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-3)', padding: 'var(--space-4)' } as const;
const tileName = { fontSize: 'var(--fs-18)', lineHeight: 'var(--lh-23)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)' };
const tileYear = { fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' };
const tileDisc = { fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' };
