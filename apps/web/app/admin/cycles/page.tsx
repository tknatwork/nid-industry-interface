import type { Metadata } from 'next';
import { AdminShell, Button, Field, StatusPill, type StatusTone } from '@nid/ui';
import { getCycleConfig, type CycleConfig } from '@nid/module-admin-cms';
import { listJdsByStatus, DISCIPLINES_REF } from '@nid/module-jd-posting';
import { updateCycleConfigAction } from './actions';

export const metadata: Metadata = {
  title: 'Cycles · Admin · NID Industry Interface',
  robots: { index: false, follow: false },
};

export default async function CyclesPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const sp = await searchParams;
  const cfg = getCycleConfig('cycle_spring_2026');

  // Discipline-exposure equity (Phase 5.2): published JDs per discipline.
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
              Dates were hand-edited into the legacy ASP.NET pages every season (a stale date once leaked). Here the
              cycle is editable structured config — and the cell watches discipline-exposure equity (Phase 5.2).
            </p>
          </header>

          {sp.saved === '1' && <p style={savedBanner}>Cycle config saved.</p>}
          {sp.error && <p role="alert" style={banner}>{decodeURIComponent(sp.error)}</p>}

          {cfg ? (
            <form action={updateCycleConfigAction} style={card}>
              <input type="hidden" name="cycleId" value={cfg.cycleId} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                <p style={labelS}>Edit current cycle{cfg.updatedAt ? ` · updated ${new Date(cfg.updatedAt).toLocaleString('en-IN')}` : ''}</p>
                <StatusPill tone={cycleTone(cfg.status)}>{cfg.status}</StatusPill>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 'var(--space-3)' }}>
                <Field id="label" name="label" label="Label" defaultValue={cfg.label} required />
                <label style={{ display: 'block' }}>
                  <span style={fieldLabel}>Status</span>
                  <select name="status" defaultValue={cfg.status} style={input}>
                    <option value="open">open</option>
                    <option value="upcoming">upcoming</option>
                    <option value="closed">closed</option>
                  </select>
                </label>
                <Field id="feeRupees" name="feeRupees" label="Fee (₹)" type="number" min={0} defaultValue={cfg.feeRupees} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
                <Field id="applyOpens" name="applyOpens" label="Applications open" defaultValue={cfg.applyOpens} required />
                <Field id="jdDeadline" name="jdDeadline" label="JD deadline" defaultValue={cfg.jdDeadline} required />
                <Field id="browseOpens" name="browseOpens" label="Browse opens" defaultValue={cfg.browseOpens} required />
                <Field id="interviewWindow" name="interviewWindow" label="Interview window" defaultValue={cfg.interviewWindow} required />
                <Field id="offerBy" name="offerBy" label="Offers by" defaultValue={cfg.offerBy} required />
              </div>
              <div style={{ marginTop: 'var(--space-4)' }}><Button type="submit" size="sm">Save cycle config</Button></div>
            </form>
          ) : (
            <p style={notice}>No cycle configured.</p>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-8)', marginBottom: 'var(--space-2)' }}>
            <p style={labelS}>Discipline-exposure equity</p>
            <StatusPill tone={underServed > 0 ? 'warning' : 'success'}>{underServed > 0 ? `${underServed} under-served` : 'all covered'}</StatusPill>
          </div>
          <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
            Published JDs targeting each discipline. Zero = no recruiter exposure — flagged so the cell can prompt outreach.
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
                <StatusPill tone={c.count === 0 ? 'warning' : 'success'}>{c.count === 0 ? 'under-served' : `${c.count} JD${c.count === 1 ? '' : 's'}`}</StatusPill>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AdminShell>
  );
}

function cycleTone(s: CycleConfig['status']): StatusTone {
  return s === 'open' ? 'success' : s === 'upcoming' ? 'info' : 'neutral';
}

const labelS = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' };
const fieldLabel = { fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' } as const;
const h1 = { fontSize: 'var(--fs-40)', lineHeight: 'var(--lh-48)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginTop: 'var(--space-1)' };
const card = { backgroundColor: 'var(--surface-card)', border: '1px solid var(--card-border)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)' } as const;
const rowCard = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)', backgroundColor: 'var(--surface-card)', border: '1px solid var(--card-border)', borderRadius: 'var(--card-radius)', padding: 'var(--space-4) var(--card-padding)' } as const;
const notice = { fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', padding: 'var(--space-4)', backgroundColor: 'var(--surface-card)', borderRadius: 'var(--radius-2)', border: '1px dashed var(--border-emphasized)' } as const;
const input = { width: '100%', marginTop: 'var(--space-1)', fontSize: 'var(--fs-14)', padding: 'var(--space-2) var(--space-3)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-2)', fontFamily: 'inherit' } as const;
const banner = { marginBottom: 'var(--space-4)', padding: 'var(--space-4)', backgroundColor: 'var(--pill-danger-bg)', color: 'var(--pill-danger-fg)', borderRadius: 'var(--radius-3)', fontWeight: 'var(--fw-600)' } as const;
const savedBanner = { marginBottom: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)', backgroundColor: 'color-mix(in oklch, var(--green-500), white 85%)', color: 'var(--text-strong)', borderRadius: 'var(--radius-2)', fontWeight: 'var(--fw-600)', fontSize: 'var(--fs-14)' } as const;
