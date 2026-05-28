import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AdminShell, Button, StatusPill, type StatusTone } from '@nid/ui';
import { getRedressalCase, type RedressalCase } from '@nid/module-admin-accountability';
import { decideRedressalAction } from './actions';

export const metadata: Metadata = {
  title: 'Redressal case · Admin · NID Industry Interface',
  robots: { index: false, follow: false },
};

const CATEGORY_LABEL: Record<RedressalCase['category'], string> = {
  'stipend-not-paid': 'Stipend not paid',
  'scope-creep-mid-internship': 'Scope creep mid-internship',
  harassment: 'Harassment',
  'jd-term-breach': 'JD-term breach',
  'contract-dishonoured': 'Contract dishonoured',
};

const DECISIONS: ReadonlyArray<{ value: string; label: string; impact: string }> = [
  { value: 'dismissed', label: 'Dismiss', impact: '0' },
  { value: 'warning', label: 'Warning', impact: '−3' },
  { value: 'upheld-score', label: 'Uphold (score impact)', impact: '−8' },
  { value: 'upheld-revoke', label: 'Uphold + revoke API', impact: '−15' },
];

export default async function RedressalCaseDetail({
  params,
  searchParams,
}: {
  params: Promise<{ caseId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { caseId } = await params;
  const c = getRedressalCase(caseId);
  if (!c) notFound();
  const error = (await searchParams).error;
  const isOpen = c.status === 'open';

  return (
    <AdminShell activeNav="redressal" roleLabel="Placement head · NID Ahmedabad">
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <a href="/admin/redressal" style={backLink}>← Redressal queue</a>

          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
            <div>
              <p style={labelS}>{c.id} · against</p>
              <h1 style={{ fontSize: 'var(--fs-24)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)' }}>
                <a href={`/admin/health-scores/${c.recruiterId}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>{c.companyName}</a>
              </h1>
            </div>
            <StatusPill tone={statusTone(c.status)}>{statusLabel(c.status)}</StatusPill>
          </header>

          {error && <p role="alert" style={banner}>{decodeURIComponent(error)}</p>}

          <div style={card}>
            <Row k="Category" v={CATEGORY_LABEL[c.category]} />
            <Row k="Complainant" v={`${c.studentLabel} (anonymised)`} />
            <Row k="Type" v={c.isInternship ? 'Internship — 14-day timeline' : 'Full-time — 30-day timeline'} />
            <Row k="Filed" v={new Date(c.filedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} />
            <div style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border-default)' }}>
              <p style={{ ...labelS, marginBottom: 'var(--space-1)' }}>Description</p>
              <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-strong)', lineHeight: 1.5 }}>{c.description}</p>
            </div>
          </div>

          {isOpen ? (
            <form action={decideRedressalAction} style={{ ...card, marginTop: 'var(--space-4)' }}>
              <input type="hidden" name="caseId" value={c.id} />
              <h2 style={{ ...labelS, marginBottom: 'var(--space-3)' }}>Decision (moves the company&apos;s health score)</h2>
              <label style={{ display: 'block', marginBottom: 'var(--space-4)' }}>
                <span style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' }}>Decision note (optional, shared in the audit trail)</span>
                <textarea name="note" rows={3} style={textarea} placeholder="Rationale for the decision…" />
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {DECISIONS.map((d) => (
                  <Button key={d.value} type="submit" name="decision" value={d.value} size="sm" variant={d.value.startsWith('upheld') ? 'primary' : 'secondary'}>
                    {d.label} ({d.impact})
                  </Button>
                ))}
              </div>
            </form>
          ) : (
            <div style={{ ...card, marginTop: 'var(--space-4)' }}>
              <p style={{ ...labelS, marginBottom: 'var(--space-1)' }}>Decision</p>
              <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-strong)' }}>
                {statusLabel(c.status)}{c.decidedAt ? ` · ${new Date(c.decidedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
              </p>
              {c.decisionNote && <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>{c.decisionNote}</p>}
            </div>
          )}
        </div>
      </section>
    </AdminShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)', fontSize: 'var(--fs-14)', padding: 'var(--space-1) 0' }}>
      <span style={{ color: 'var(--text-secondary)' }}>{k}</span>
      <span style={{ color: 'var(--text-strong)', fontWeight: 'var(--fw-500)', textAlign: 'right' }}>{v}</span>
    </div>
  );
}

function statusLabel(s: RedressalCase['status']): string {
  return s === 'open' ? 'open' : s === 'dismissed' ? 'dismissed' : s === 'warning' ? 'warning' : s === 'upheld-score' ? 'upheld' : 'upheld · revoked';
}
function statusTone(s: RedressalCase['status']): StatusTone {
  return s === 'open' ? 'warning' : s === 'dismissed' ? 'neutral' : 'danger';
}

const labelS = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' };
const backLink = { ...labelS, textDecoration: 'none', display: 'inline-block', marginBottom: 'var(--space-4)' };
const card = { backgroundColor: 'var(--surface-card)', border: '1px solid var(--card-border)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)' } as const;
const banner = { marginBottom: 'var(--space-4)', padding: 'var(--space-4)', backgroundColor: 'var(--pill-danger-bg)', color: 'var(--pill-danger-fg)', borderRadius: 'var(--radius-3)', fontWeight: 'var(--fw-600)' } as const;
const textarea = { width: '100%', marginTop: 'var(--space-1)', fontSize: 'var(--fs-14)', padding: 'var(--space-2) var(--space-3)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-2)', fontFamily: 'inherit', resize: 'vertical' as const };
