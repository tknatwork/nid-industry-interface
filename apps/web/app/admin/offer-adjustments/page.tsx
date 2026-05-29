import type { Metadata } from 'next';
import { AdminShell, Button, StatusPill, type StatusTone } from '@nid/ui';
import { listOfferAdjustments, type OfferAdjustmentCase } from '@nid/module-admin-accountability';
import { rupees } from '~/lib/money';
import { decideAdjustmentAction } from './actions';

export const metadata: Metadata = {
  title: 'Offer adjustments · Admin · NID Industry Interface',
  robots: { index: false, follow: false },
};

export default async function OfferAdjustmentsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const error = (await searchParams).error;
  const cases = listOfferAdjustments();
  const open = cases.filter((c) => c.status === 'open');
  const decided = cases.filter((c) => c.status !== 'open');

  return (
    <AdminShell activeNav="offer-adjustments" roleLabel="Placement head · NID Ahmedabad">
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <header style={{ marginBottom: 'var(--space-6)' }}>
            <p style={labelS}>Accountability</p>
            <h1 style={h1}>Offer adjustments</h1>
            <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
              Pay-differential queue (Phase 5.14). A company that wants to change a published offer&apos;s compensation
              files here — the cell adjudicates so post-offer changes stay accountable rather than happening over email.
              A decision moves the company&apos;s health score.
            </p>
          </header>

          {error && <p role="alert" style={banner}>{decodeURIComponent(error)}</p>}

          <p style={{ ...labelS, marginBottom: 'var(--space-3)' }}>Open ({open.length})</p>
          {open.length === 0 ? (
            <p style={notice}>No open adjustment requests.</p>
          ) : (
            <div style={{ display: 'grid', gap: 'var(--space-3)', marginBottom: 'var(--space-8)' }}>
              {open.map((c) => (
                <div key={c.id} style={card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
                    <p style={{ fontSize: 'var(--fs-16)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>
                      {c.companyName} · {c.studentLabel}
                    </p>
                    <StatusPill tone="warning">open</StatusPill>
                  </div>
                  <p style={{ fontSize: 'var(--fs-16)', color: 'var(--text-strong)', marginTop: 'var(--space-2)' }}>
                    {rupees(c.currentPaise)} <span style={{ color: 'var(--text-secondary)' }}>→</span> {rupees(c.newPaise)}
                  </p>
                  <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
                    {c.category} · filed {fmt(c.filedAt)}
                  </p>
                  <form action={decideAdjustmentAction} style={{ marginTop: 'var(--space-3)', display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <input type="hidden" name="caseId" value={c.id} />
                    <label style={{ flex: 1, minWidth: '180px' }}>
                      <span style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' }}>Decision note (optional)</span>
                      <input name="note" placeholder="Rationale…" style={input} />
                    </label>
                    <Button type="submit" name="decision" value="approved" size="sm">Approve</Button>
                    <Button type="submit" name="decision" value="denied" size="sm" variant="ghost">Deny</Button>
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
                    {c.companyName} · {c.studentLabel} · {rupees(c.currentPaise)} → {rupees(c.newPaise)}
                  </p>
                  <StatusPill tone={statusTone(c.status)}>{c.status}</StatusPill>
                </div>
                {c.decisionNote && <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>{c.decisionNote}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </AdminShell>
  );
}

function statusTone(s: OfferAdjustmentCase['status']): StatusTone {
  return s === 'approved' ? 'success' : s === 'denied' ? 'danger' : 'warning';
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
