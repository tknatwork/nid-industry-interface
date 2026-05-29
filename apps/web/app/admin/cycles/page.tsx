import type { Metadata } from 'next';
import { AdminShell, StatusPill, type StatusTone } from '@nid/ui';
import { CYCLES, type Cycle } from '~/lib/public-content';
import { listJdsByStatus, DISCIPLINES_REF } from '@nid/module-jd-posting';

export const metadata: Metadata = {
  title: 'Cycles · Admin · NID Industry Interface',
  robots: { index: false, follow: false },
};

export default function CyclesPage() {
  // The cycle the placement cell is actively running. Falls back to the first
  // configured cycle so the page never renders empty.
  const current = CYCLES.find((c) => c.status === 'open') ?? CYCLES[0];

  // Discipline-exposure equity (Phase 5.2): count published JDs targeting each
  // discipline so the cell can spot disciplines no recruiter is hiring for.
  const published = listJdsByStatus('published');
  const coverage = DISCIPLINES_REF.map((d) => ({
    id: d.id,
    name: d.name,
    count: published.filter((jd) => jd.targetDisciplineIds.includes(d.id)).length,
  }));
  const underServed = coverage.filter((c) => c.count === 0).length;

  return (
    <AdminShell activeNav="cycles" roleLabel="Placement head · NID Ahmedabad">
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <header style={{ marginBottom: 'var(--space-6)' }}>
            <p style={labelS}>Cycle administration</p>
            <h1 style={h1}>Cycles</h1>
            <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
              Cycle dates were hand-edited into the legacy ASP.NET pages every season. Here they are structured
              configuration with discipline eligibility, and the cell can watch discipline-exposure equity (Phase 5.2)
              instead of discovering gaps after the cycle closes.
            </p>
          </header>

          {current ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                <p style={labelS}>Current cycle</p>
                <StatusPill tone={cycleTone(current.status)}>{current.status}</StatusPill>
              </div>
              <div style={card}>
                <p style={{ fontSize: 'var(--fs-20)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>{current.label}</p>
                <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
                  Participation fee ₹{current.feeRupees.toLocaleString('en-IN')} · {current.eligibleDisciplines.length} disciplines eligible
                </p>
                <dl style={{ marginTop: 'var(--space-4)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
                  <DateField term="Applications open" value={current.applyOpens} />
                  <DateField term="JD deadline" value={current.jdDeadline} />
                  <DateField term="Browse opens" value={current.browseOpens} />
                  <DateField term="Interview window" value={current.interviewWindow} />
                  <DateField term="Offers by" value={current.offerBy} />
                </dl>
              </div>
            </>
          ) : (
            <p style={notice}>No cycle configured.</p>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-8)', marginBottom: 'var(--space-2)' }}>
            <p style={labelS}>Discipline-exposure equity</p>
            <StatusPill tone={underServed > 0 ? 'warning' : 'success'}>
              {underServed > 0 ? `${underServed} under-served` : 'all covered'}
            </StatusPill>
          </div>
          <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
            Published JDs targeting each discipline this cycle. A discipline with zero JDs gets no recruiter exposure —
            flagged so the cell can prompt outreach before the cycle closes.
          </p>
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            {coverage.map((c) => (
              <div key={c.id} style={rowCard}>
                <div>
                  <p style={{ fontSize: 'var(--fs-16)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>{c.name}</p>
                  <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' }}>
                    {c.count === 0 ? 'No JDs target this discipline' : `${c.count} published JD${c.count === 1 ? '' : 's'}`}
                  </p>
                </div>
                {c.count === 0 ? (
                  <StatusPill tone="warning">under-served</StatusPill>
                ) : (
                  <StatusPill tone="success">{c.count} JD{c.count === 1 ? '' : 's'}</StatusPill>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </AdminShell>
  );
}

function DateField({ term, value }: { term: string; value: string }) {
  return (
    <div>
      <dt style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{term}</dt>
      <dd style={{ fontSize: 'var(--fs-16)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginTop: 'var(--space-1)' }}>{value}</dd>
    </div>
  );
}

function cycleTone(s: Cycle['status']): StatusTone {
  return s === 'open' ? 'success' : s === 'upcoming' ? 'info' : 'neutral';
}

const labelS = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' };
const h1 = { fontSize: 'var(--fs-40)', lineHeight: 'var(--lh-48)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginTop: 'var(--space-1)' };
const card = { backgroundColor: 'var(--surface-card)', border: '1px solid var(--card-border)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)' } as const;
const rowCard = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)', backgroundColor: 'var(--surface-card)', border: '1px solid var(--card-border)', borderRadius: 'var(--card-radius)', padding: 'var(--space-4) var(--card-padding)' } as const;
const notice = { fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', padding: 'var(--space-4)', backgroundColor: 'var(--surface-card)', borderRadius: 'var(--radius-2)', border: '1px dashed var(--border-emphasized)' } as const;
