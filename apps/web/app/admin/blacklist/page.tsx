import type { Metadata } from 'next';
import { AdminShell, Button, Field, StatusPill } from '@nid/ui';
import { listBlacklist, listRecruiterScores } from '@nid/module-admin-accountability';
import { addBlacklistAction, liftBlacklistAction } from './actions';

export const metadata: Metadata = {
  title: 'Blacklist · Admin · NID Industry Interface',
  robots: { index: false, follow: false },
};

export default async function BlacklistPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const error = (await searchParams).error;
  const entries = listBlacklist();
  const active = entries.filter((e) => !e.lifted);
  const lifted = entries.filter((e) => e.lifted);
  const blacklistedIds = new Set(active.map((e) => e.recruiterId));
  // Candidates to add: companies not already actively blacklisted.
  const candidates = listRecruiterScores().filter((s) => !blacklistedIds.has(s.recruiterId));

  return (
    <AdminShell activeNav="blacklist" roleLabel="Placement head · NID Ahmedabad">
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <header style={{ marginBottom: 'var(--space-6)' }}>
            <p style={labelS}>Accountability</p>
            <h1 style={h1}>Blacklist</h1>
            <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
              Blocked from re-applying for a cooldown period (Phase 5.8). Lift-able with a logged reason — never deleted.
            </p>
          </header>

          {error && <p role="alert" style={banner}>{decodeURIComponent(error)}</p>}

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 'var(--space-8)' }}>
            <div>
              <p style={{ ...labelS, marginBottom: 'var(--space-3)' }}>Active ({active.length})</p>
              {active.length === 0 ? (
                <p style={notice}>No companies are currently blacklisted.</p>
              ) : (
                <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                  {active.map((e) => (
                    <div key={e.recruiterId} style={card}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
                        <p style={{ fontSize: 'var(--fs-16)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>{e.companyName}</p>
                        <StatusPill tone="danger">blacklisted</StatusPill>
                      </div>
                      <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
                        {e.cooldownMonths}-month cooldown · since {fmt(e.addedAt)}
                      </p>
                      <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-strong)', marginTop: 'var(--space-2)' }}>{e.reason}</p>
                      <form action={liftBlacklistAction} style={{ marginTop: 'var(--space-3)', display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <input type="hidden" name="recruiterId" value={e.recruiterId} />
                        <label style={{ flex: 1, minWidth: '160px' }}>
                          <span style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' }}>Reason to lift</span>
                          <input name="reason" required placeholder="e.g. remediation verified" style={input} />
                        </label>
                        <Button type="submit" size="sm" variant="secondary">Lift</Button>
                      </form>
                    </div>
                  ))}
                </div>
              )}

              {lifted.length > 0 && (
                <>
                  <p style={{ ...labelS, margin: 'var(--space-6) 0 var(--space-3)' }}>Lifted ({lifted.length})</p>
                  <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                    {lifted.map((e) => (
                      <div key={e.recruiterId} style={{ ...card, opacity: 0.7 }}>
                        <p style={{ fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>{e.companyName}</p>
                        <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' }}>Lifted{e.liftedAt ? ` ${fmt(e.liftedAt)}` : ''}{e.liftedReason ? ` · ${e.liftedReason}` : ''}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div>
              <p style={{ ...labelS, marginBottom: 'var(--space-3)' }}>Add a company</p>
              <form action={addBlacklistAction} style={card}>
                <label style={{ display: 'block', marginBottom: 'var(--space-3)' }}>
                  <span style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' }}>Company</span>
                  <select name="recruiterId" required style={input} defaultValue="">
                    <option value="" disabled>Select a company…</option>
                    {candidates.map((c) => (
                      <option key={c.recruiterId} value={c.recruiterId}>
                        {c.companyName} — {c.band} ({c.score})
                      </option>
                    ))}
                  </select>
                </label>
                <Field id="bl-reason" name="reason" label="Reason (required)" placeholder="What triggered this?" required />
                <label style={{ display: 'block', marginTop: 'var(--space-3)' }}>
                  <span style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' }}>Cooldown (months)</span>
                  <input name="cooldownMonths" type="number" min={1} max={60} defaultValue={12} style={input} />
                </label>
                <div style={{ marginTop: 'var(--space-4)' }}>
                  <Button type="submit" size="sm">Add to blacklist</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const labelS = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' };
const h1 = { fontSize: 'var(--fs-40)', lineHeight: 'var(--lh-48)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginTop: 'var(--space-1)' };
const card = { backgroundColor: 'var(--surface-card)', border: '1px solid var(--card-border)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)' } as const;
const notice = { fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', padding: 'var(--space-4)', backgroundColor: 'var(--surface-card)', borderRadius: 'var(--radius-2)', border: '1px dashed var(--border-emphasized)' } as const;
const banner = { marginBottom: 'var(--space-4)', padding: 'var(--space-4)', backgroundColor: 'var(--pill-danger-bg)', color: 'var(--pill-danger-fg)', borderRadius: 'var(--radius-3)', fontWeight: 'var(--fw-600)' } as const;
const input = { width: '100%', marginTop: 'var(--space-1)', fontSize: 'var(--fs-14)', padding: 'var(--space-2) var(--space-3)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-2)', fontFamily: 'inherit' } as const;
