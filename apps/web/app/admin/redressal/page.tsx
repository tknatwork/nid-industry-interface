import type { Metadata } from 'next';
import { AdminShell, StatusPill, type StatusTone } from '@nid/ui';
import { listRedressal, type RedressalCase } from '@nid/module-admin-accountability';

export const metadata: Metadata = {
  title: 'Redressal · Admin · NID Industry Interface',
  robots: { index: false, follow: false },
};

export const CATEGORY_LABEL: Record<RedressalCase['category'], string> = {
  'stipend-not-paid': 'Stipend not paid',
  'scope-creep-mid-internship': 'Scope creep mid-internship',
  harassment: 'Harassment',
  'jd-term-breach': 'JD-term breach',
  'contract-dishonoured': 'Contract dishonoured',
};

export default function RedressalQueue() {
  const cases = listRedressal();
  const open = cases.filter((c) => c.status === 'open');
  const decided = cases.filter((c) => c.status !== 'open');

  return (
    <AdminShell activeNav="redressal" roleLabel="Placement head · NID Ahmedabad">
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <header style={{ marginBottom: 'var(--space-6)' }}>
            <p style={labelS}>Accountability</p>
            <h1 style={h1}>Student redressal</h1>
            <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
              Complaints against companies. Internships get a stricter timeline (Phase 5.7). A decision moves the
              company&apos;s health score.
            </p>
          </header>

          <p style={{ ...labelS, marginBottom: 'var(--space-3)' }}>Open ({open.length})</p>
          {open.length === 0 ? (
            <p style={notice}>No open cases.</p>
          ) : (
            <div style={{ display: 'grid', gap: 'var(--space-2)', marginBottom: 'var(--space-8)' }}>
              {open.map((c) => <CaseRow key={c.id} c={c} />)}
            </div>
          )}

          <p style={{ ...labelS, marginBottom: 'var(--space-3)' }}>Decided ({decided.length})</p>
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            {decided.map((c) => <CaseRow key={c.id} c={c} />)}
          </div>
        </div>
      </section>
    </AdminShell>
  );
}

function CaseRow({ c }: { c: RedressalCase }) {
  return (
    <a href={`/admin/redressal/${c.id}`} style={rowCard}>
      <div>
        <p style={{ fontSize: 'var(--fs-16)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>
          {c.companyName} · {CATEGORY_LABEL[c.category]}
        </p>
        <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' }}>
          {c.studentLabel} · {c.isInternship ? 'internship (strict)' : 'full-time'} · filed {fmt(c.filedAt)}
        </p>
      </div>
      <StatusPill tone={statusTone(c.status)}>{statusLabel(c.status)}</StatusPill>
    </a>
  );
}

export function statusLabel(s: RedressalCase['status']): string {
  return s === 'open' ? 'open' : s === 'dismissed' ? 'dismissed' : s === 'warning' ? 'warning' : s === 'upheld-score' ? 'upheld' : 'upheld · revoked';
}
export function statusTone(s: RedressalCase['status']): StatusTone {
  return s === 'open' ? 'warning' : s === 'dismissed' ? 'neutral' : 'danger';
}
function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const labelS = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' };
const h1 = { fontSize: 'var(--fs-40)', lineHeight: 'var(--lh-48)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginTop: 'var(--space-1)' };
const rowCard = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)', backgroundColor: 'var(--surface-card)', border: '1px solid var(--card-border)', borderRadius: 'var(--card-radius)', padding: 'var(--space-4) var(--card-padding)', textDecoration: 'none' } as const;
const notice = { fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', padding: 'var(--space-4)', backgroundColor: 'var(--surface-card)', borderRadius: 'var(--radius-2)', border: '1px dashed var(--border-emphasized)', marginBottom: 'var(--space-8)' } as const;
