import type { Metadata } from 'next';
import { AdminShell, Button, StatusPill, type StatusTone } from '@nid/ui';
import { listApiKeys, type ApiKey } from '@nid/module-admin-accountability';
import { revokeApiKeyAction } from './actions';

export const metadata: Metadata = {
  title: 'API keys · Admin · NID Industry Interface',
  robots: { index: false, follow: false },
};

export default async function ApiKeysPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const error = (await searchParams).error;
  const keys = listApiKeys();
  const active = keys.filter((k) => k.status === 'active');
  const revoked = keys.filter((k) => k.status === 'revoked');

  return (
    <AdminShell activeNav="api-keys" roleLabel="Placement head · NID Ahmedabad">
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <header style={{ marginBottom: 'var(--space-6)' }}>
            <p style={labelS}>Integrations</p>
            <h1 style={h1}>Recruiter API keys</h1>
            <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
              The registry for recruiter-issued API keys (Phase 5.9). Keys grant scoped programmatic access — for example
              an ATS pulling its own JD statuses. The cell can revoke a key here; revocation is logged with a reason.
            </p>
          </header>

          {error && <p role="alert" style={banner}>{decodeURIComponent(error)}</p>}

          <p style={{ ...labelS, marginBottom: 'var(--space-3)' }}>Active ({active.length})</p>
          {active.length === 0 ? (
            <p style={notice}>No active keys.</p>
          ) : (
            <div style={{ display: 'grid', gap: 'var(--space-3)', marginBottom: 'var(--space-8)' }}>
              {active.map((k) => (
                <div key={k.id} style={card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
                    <p style={{ fontSize: 'var(--fs-16)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>{k.companyName}</p>
                    <StatusPill tone="success">active</StatusPill>
                  </div>
                  <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
                    scope: {k.scope} · issued {fmt(k.issuedAt)}
                  </p>
                  <form action={revokeApiKeyAction} style={{ marginTop: 'var(--space-3)', display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <input type="hidden" name="keyId" value={k.id} />
                    <label style={{ flex: 1, minWidth: '180px' }}>
                      <span style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' }}>Reason (required)</span>
                      <input name="reason" required placeholder="Why is this key being revoked?" style={input} />
                    </label>
                    <Button type="submit" size="sm" variant="ghost">Revoke</Button>
                  </form>
                </div>
              ))}
            </div>
          )}

          <p style={{ ...labelS, marginBottom: 'var(--space-3)' }}>Revoked ({revoked.length})</p>
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            {revoked.map((k) => (
              <div key={k.id} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
                  <p style={{ fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>{k.companyName} · scope: {k.scope}</p>
                  <StatusPill tone={statusTone(k.status)}>revoked</StatusPill>
                </div>
                <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
                  {k.revokedReason ?? 'No reason recorded'}{k.revokedAt ? ` · ${fmt(k.revokedAt)}` : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AdminShell>
  );
}

function statusTone(s: ApiKey['status']): StatusTone {
  return s === 'active' ? 'success' : 'danger';
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
