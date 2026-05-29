import type { Metadata } from 'next';
import { AdminShell, Button, StatusPill, type StatusTone } from '@nid/ui';
import { listStudentConduct, type StudentConductCase } from '@nid/module-admin-accountability';
import { decideConductAction } from './actions';

export const metadata: Metadata = {
  title: 'Student conduct · Admin · NID Industry Interface',
  robots: { index: false, follow: false },
};

const KIND_LABEL: Record<StudentConductCase['kind'], string> = {
  'no-show': 'No-show at interview',
  'ghost-after-acceptance': 'Ghosted after acceptance',
};

export default async function StudentConductPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const error = (await searchParams).error;
  const cases = listStudentConduct();
  const open = cases.filter((c) => c.status === 'open');
  const decided = cases.filter((c) => c.status !== 'open');

  return (
    <AdminShell activeNav="student-conduct" roleLabel="Placement head · NID Ahmedabad">
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <header style={{ marginBottom: 'var(--space-6)' }}>
            <p style={labelS}>Accountability</p>
            <h1 style={h1}>Student conduct</h1>
            <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
              The student-side mirror of the company queue (Phase 5.10). Companies report no-shows and post-acceptance
              ghosting; the cell decides proportionately. A student may appeal a decision — their note shows here.
            </p>
          </header>

          {error && <p role="alert" style={banner}>{decodeURIComponent(error)}</p>}

          <p style={{ ...labelS, marginBottom: 'var(--space-3)' }}>Open ({open.length})</p>
          {open.length === 0 ? (
            <p style={notice}>No open conduct cases.</p>
          ) : (
            <div style={{ display: 'grid', gap: 'var(--space-3)', marginBottom: 'var(--space-8)' }}>
              {open.map((c) => (
                <div key={c.id} style={card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
                    <p style={{ fontSize: 'var(--fs-16)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>
                      {c.studentLabel} · {KIND_LABEL[c.kind]}
                    </p>
                    <StatusPill tone="warning">open</StatusPill>
                  </div>
                  <p style={{ fontSize: 'var(--fs-13)', color: 'var(--text-strong)', marginTop: 'var(--space-1)' }}>{c.description}</p>
                  <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' }}>
                    reported by {c.companyName} · filed {fmt(c.filedAt)}
                  </p>
                  <form action={decideConductAction} style={{ marginTop: 'var(--space-3)', display: 'grid', gap: 'var(--space-2)' }}>
                    <input type="hidden" name="caseId" value={c.id} />
                    <label>
                      <span style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' }}>Decision note (optional)</span>
                      <input name="note" placeholder="Rationale…" style={input} />
                    </label>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                      <Button type="submit" name="decision" value="dismissed" size="sm" variant="ghost">Dismiss</Button>
                      <Button type="submit" name="decision" value="warning" size="sm" variant="secondary">Warning</Button>
                      <Button type="submit" name="decision" value="visibility-reduced" size="sm" variant="secondary">Reduce visibility</Button>
                      <Button type="submit" name="decision" value="ineligible" size="sm">Ineligible</Button>
                    </div>
                  </form>
                </div>
              ))}
            </div>
          )}

          <p style={{ ...labelS, marginBottom: 'var(--space-3)' }}>Decided ({decided.length})</p>
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            {decided.map((c) => (
              <div key={c.id} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
                  <p style={{ fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>
                    {c.studentLabel} · {KIND_LABEL[c.kind]} · {c.companyName}
                  </p>
                  <StatusPill tone={statusTone(c.status)}>{statusLabel(c.status)}</StatusPill>
                </div>
                {c.decisionNote && <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>{c.decisionNote}</p>}
                {c.appealNote && (
                  <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
                    <span style={{ fontWeight: 'var(--fw-600)' }}>Appeal:</span> {c.appealNote}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </AdminShell>
  );
}

function statusLabel(s: StudentConductCase['status']): string {
  return s === 'visibility-reduced' ? 'visibility reduced' : s;
}
function statusTone(s: StudentConductCase['status']): StatusTone {
  return s === 'dismissed' ? 'neutral' : s === 'warning' ? 'warning' : 'danger';
}
function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const labelS = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' };
const h1 = { fontSize: 'var(--fs-40)', lineHeight: 'var(--lh-48)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginTop: 'var(--space-1)' };
const card = { backgroundColor: 'var(--surface-card)', border: '1px solid var(--card-border)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)' } as const;
const notice = { fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', padding: 'var(--space-4)', backgroundColor: 'var(--surface-card)', borderRadius: 'var(--radius-2)', border: '1px dashed var(--border-emphasized)', marginBottom: 'var(--space-8)' } as const;
const banner = { marginBottom: 'var(--space-4)', padding: 'var(--space-4)', backgroundColor: 'var(--pill-danger-bg)', color: 'var(--pill-danger-fg)', borderRadius: 'var(--radius-3)', fontWeight: 'var(--fw-600)' } as const;
const input = { width: '100%', marginTop: 'var(--space-1)', fontSize: 'var(--fs-14)', padding: 'var(--space-2) var(--space-3)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-2)', fontFamily: 'inherit' } as const;
