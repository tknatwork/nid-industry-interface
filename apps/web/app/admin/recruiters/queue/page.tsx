import type { Metadata } from 'next';
import { AdminShell, StatusPill } from '@nid/ui';
import {
  listAll,
  type ApplicationTokenRecord,
  type RecruiterStatus,
} from '@nid/module-recruiter-onboarding';

export const metadata: Metadata = {
  title: 'Recruiter queue · Admin · NID Industry Interface',
  robots: { index: false, follow: false },
};

interface SearchParams {
  readonly status?: string;
}

export default async function RecruiterQueuePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const all = listAll();
  const activeFilter = params.status ?? 'all';
  const filtered = activeFilter === 'all' ? all : all.filter((t) => t.status === activeFilter);

  const counts = bucketCounts(all);

  return (
    <AdminShell activeNav="queue" roleLabel="Placement head · NID Ahmedabad">
      <section
        style={{
          paddingInline: 'var(--layout-page-x)',
          paddingBlock: 'var(--space-10)',
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <header style={{ marginBottom: 'var(--space-8)' }}>
            <p
              style={{
                fontSize: 'var(--fs-12)',
                fontWeight: 'var(--fw-600)',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 'var(--space-2)',
              }}
            >
              Spring 2026 · {all.length} applications
            </p>
            <h1
              style={{
                fontSize: 'var(--fs-40)',
                lineHeight: 'var(--lh-48)',
                fontWeight: 'var(--fw-500)',
                color: 'var(--text-strong)',
              }}
            >
              Recruiter queue
            </h1>
            <p
              style={{
                fontSize: 'var(--fs-16)',
                color: 'var(--text-primary)',
                marginTop: 'var(--space-3)',
                maxWidth: '720px',
              }}
            >
              Vet new applications, issue invoices, mark payments, approve, and mint credentials.
              Every action is recorded; the recruiter sees the same timeline at <code>/track/&lt;token&gt;</code>.
            </p>
          </header>

          <FilterTabs counts={counts} active={activeFilter} />

          <div
            role="region"
            aria-label="Application token table"
            style={{
              backgroundColor: 'var(--surface-card)',
              borderRadius: 'var(--card-radius)',
              border: '1px solid var(--card-border)',
              overflow: 'hidden',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 'var(--fs-14)',
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: 'var(--surface-panel)',
                    textAlign: 'left',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    fontSize: 'var(--fs-12)',
                    fontWeight: 'var(--fw-600)',
                  }}
                >
                  <th style={cellStyle}>Token</th>
                  <th style={cellStyle}>Company</th>
                  <th style={cellStyle}>Sector</th>
                  <th style={cellStyle}>Status</th>
                  <th style={cellStyle}>Submitted</th>
                  <th style={{ ...cellStyle, textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ ...cellStyle, textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No applications in this bucket.
                    </td>
                  </tr>
                )}
                {filtered.map((record) => (
                  <tr key={record.tokenId} style={{ borderTop: '1px solid var(--border-default)' }}>
                    <td style={{ ...cellStyle, fontFamily: 'ui-monospace, monospace', color: 'var(--text-strong)' }}>
                      {record.tokenId}
                    </td>
                    <td style={{ ...cellStyle, color: 'var(--text-strong)', fontWeight: 'var(--fw-500)' }}>
                      {record.companyName}
                      <div
                        style={{
                          fontSize: 'var(--fs-12)',
                          color: 'var(--text-secondary)',
                          fontWeight: 'var(--fw-400)',
                          marginTop: 'var(--space-1)',
                        }}
                      >
                        {record.corporateEmail}
                      </div>
                    </td>
                    <td style={cellStyle}>{record.sector}</td>
                    <td style={cellStyle}>
                      <StatusPill tone={toneFor(record.status)}>{statusLabel(record.status)}</StatusPill>
                    </td>
                    <td style={{ ...cellStyle, color: 'var(--text-secondary)' }}>
                      <time dateTime={record.createdAt}>{formatHuman(record.createdAt)}</time>
                    </td>
                    <td style={{ ...cellStyle, textAlign: 'right' }}>
                      <a
                        href={`/admin/recruiters/${record.tokenId}`}
                        style={{
                          color: 'var(--accent)',
                          fontWeight: 'var(--fw-600)',
                          textDecoration: 'none',
                          fontSize: 'var(--fs-14)',
                        }}
                      >
                        Review →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}

const cellStyle = {
  padding: 'var(--space-4) var(--space-5)',
  verticalAlign: 'top' as const,
};

const FILTER_ORDER: ReadonlyArray<{ key: string; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'application-received', label: 'New' },
  { key: 'verification-pending', label: 'Verifying' },
  { key: 'fee-due', label: 'Fee due' },
  { key: 'payment-received', label: 'Awaiting approval' },
  { key: 'approved', label: 'Approved' },
  { key: 'credentials-issued', label: 'Active' },
  { key: 'rejected', label: 'Rejected' },
];

function FilterTabs({
  counts,
  active,
}: {
  counts: ReadonlyMap<string, number>;
  active: string;
}) {
  return (
    <div
      role="tablist"
      aria-label="Filter applications by status"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'var(--space-2)',
        marginBottom: 'var(--space-6)',
      }}
    >
      {FILTER_ORDER.map((tab) => {
        const isActive = tab.key === active;
        const count = counts.get(tab.key) ?? 0;
        return (
          <a
            key={tab.key}
            href={tab.key === 'all' ? '/admin/recruiters/queue' : `/admin/recruiters/queue?status=${tab.key}`}
            role="tab"
            aria-selected={isActive}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--fs-14)',
              fontWeight: 'var(--fw-600)',
              backgroundColor: isActive ? 'var(--accent)' : 'var(--surface-panel)',
              color: isActive ? 'var(--text-on-accent)' : 'var(--text-primary)',
              textDecoration: 'none',
              transition: 'background-color var(--motion-micro)',
            }}
          >
            {tab.label}
            <span
              style={{
                fontSize: 'var(--fs-12)',
                opacity: 0.7,
              }}
            >
              {count}
            </span>
          </a>
        );
      })}
    </div>
  );
}

function bucketCounts(records: readonly ApplicationTokenRecord[]): Map<string, number> {
  const m = new Map<string, number>();
  m.set('all', records.length);
  for (const r of records) {
    m.set(r.status, (m.get(r.status) ?? 0) + 1);
  }
  return m;
}

function statusLabel(status: RecruiterStatus): string {
  switch (status) {
    case 'application-received':
      return 'New';
    case 'verification-pending':
      return 'Verifying';
    case 'fee-due':
      return 'Fee due';
    case 'payment-received':
      return 'Awaiting approval';
    case 'approved':
      return 'Approved';
    case 'credentials-issued':
      return 'Active';
    case 'rejected':
      return 'Rejected';
  }
}

function toneFor(status: RecruiterStatus): 'neutral' | 'info' | 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'application-received':
      return 'info';
    case 'verification-pending':
      return 'info';
    case 'fee-due':
      return 'warning';
    case 'payment-received':
      return 'info';
    case 'approved':
      return 'success';
    case 'credentials-issued':
      return 'success';
    case 'rejected':
      return 'danger';
  }
}

function formatHuman(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}
