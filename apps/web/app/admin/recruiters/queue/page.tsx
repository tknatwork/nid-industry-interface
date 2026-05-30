import type { Metadata } from 'next';
import { AdminShell, StatusPill } from '@nid/ui';
import {
  listAll,
  type ApplicationTicketRecord,
  type RecruiterStatus,
} from '@nid/module-recruiter-onboarding';
import { PARENT_COMPANIES, type ParentCompany } from '~/lib/recruiter-public';

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
              Every action is recorded; the recruiter sees the same timeline at <code>/track/&lt;ticket&gt;</code>.
            </p>
          </header>

          <FilterTabs counts={counts} active={activeFilter} />

          <div
            role="region"
            aria-label="Application ticket table"
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
                  <th style={cellStyle}>Ticket</th>
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
                    <td colSpan={COL_COUNT} style={{ ...cellStyle, textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No applications in this bucket.
                    </td>
                  </tr>
                )}
                {buildRenderGroups(filtered).map((group) =>
                  group.kind === 'standalone' ? (
                    <TicketRow key={group.record.ticketId} record={group.record} />
                  ) : (
                    <ParentGroup key={`parent-${group.parent.id}`} parent={group.parent} branches={group.branches} />
                  ),
                )}
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

/** Number of columns in the queue table — keep in lock-step with <thead>. */
const COL_COUNT = 6;

// ── Multi-branch grouping (plan Round 3 §D) ─────────────────────────────────
//
// One company can run MULTIPLE branches, each a SEPARATE recruiter account with
// its OWN GST / corporate email / status / detail page. Tickets sharing a
// `parentCompanyId` (resolved to a name via PARENT_COMPANIES) render UNDER one
// parent-company header — "manage related companies together, separate each
// branch". Tickets with no known parent render as standalone rows, exactly as
// before. Grouping happens AFTER the status filter, so a parent header only
// appears for branches that survive the active filter and its branch count
// reflects what is actually shown.

type RenderGroup =
  | { readonly kind: 'standalone'; readonly record: ApplicationTicketRecord }
  | {
      readonly kind: 'parent';
      readonly parent: ParentCompany;
      readonly branches: readonly ApplicationTicketRecord[];
    };

/**
 * Turn an ordered, already-filtered ticket list into an ordered list of render
 * groups. Standalone tickets keep their original position; each parent's
 * branches are clustered together at the position of that parent's FIRST branch,
 * so the surrounding standalone rows stay where the admin expects them.
 */
function buildRenderGroups(records: readonly ApplicationTicketRecord[]): readonly RenderGroup[] {
  const groups: RenderGroup[] = [];
  const branchesByParent = new Map<string, ApplicationTicketRecord[]>();
  const parentSlotIndex = new Map<string, number>();

  for (const record of records) {
    const parentId = record.parentCompanyId;
    const parent = parentId != null ? PARENT_COMPANIES[parentId] : undefined;

    // No grouping id, or an id we don't have a registered parent for → render
    // standalone (current behaviour, never dropped).
    if (parentId == null || parent === undefined) {
      groups.push({ kind: 'standalone', record });
      continue;
    }

    let branches = branchesByParent.get(parentId);
    if (branches === undefined) {
      // First branch of this parent in the list — reserve its slot here.
      branches = [];
      branchesByParent.set(parentId, branches);
      parentSlotIndex.set(parentId, groups.length);
      groups.push({ kind: 'parent', parent, branches });
    }
    branches.push(record);
  }

  // A parent that only contributed a single visible branch (e.g. the status
  // filter hid its siblings) reads better as a plain standalone row than as a
  // "· 1 branch" group, so collapse those back.
  return groups.map((group) => {
    if (group.kind === 'parent' && group.branches.length === 1) {
      return { kind: 'standalone', record: group.branches[0]! } satisfies RenderGroup;
    }
    return group;
  });
}

/** Parent-company header row + each branch row beneath it. */
function ParentGroup({
  parent,
  branches,
}: {
  parent: ParentCompany;
  branches: readonly ApplicationTicketRecord[];
}) {
  return (
    <>
      <tr style={{ borderTop: '1px solid var(--border-default)' }}>
        <td
          colSpan={COL_COUNT}
          style={{
            ...cellStyle,
            backgroundColor: 'var(--surface-panel)',
            paddingBlock: 'var(--space-3)',
          }}
        >
          <span
            style={{
              fontSize: 'var(--fs-14)',
              fontWeight: 'var(--fw-600)',
              color: 'var(--text-strong)',
            }}
          >
            {parent.name}
          </span>
          <span
            style={{
              fontSize: 'var(--fs-12)',
              color: 'var(--text-secondary)',
              marginLeft: 'var(--space-2)',
            }}
          >
            · {branches.length} branches · separate accounts
          </span>
        </td>
      </tr>
      {branches.map((record) => (
        <TicketRow key={record.ticketId} record={record} branch />
      ))}
    </>
  );
}

/**
 * A single ticket row. Renders standalone tickets and parent branches alike;
 * `branch` indents the company cell and swaps the company name for the branch
 * label (the parent name already sits in the header above).
 */
function TicketRow({ record, branch = false }: { record: ApplicationTicketRecord; branch?: boolean }) {
  return (
    <tr style={{ borderTop: '1px solid var(--border-default)' }}>
      <td
        style={{
          ...cellStyle,
          fontFamily: 'ui-monospace, monospace',
          color: 'var(--text-strong)',
          paddingLeft: branch ? 'var(--space-8)' : undefined,
        }}
      >
        {record.ticketId}
      </td>
      <td style={{ ...cellStyle, color: 'var(--text-strong)', fontWeight: 'var(--fw-500)' }}>
        {branch && record.branchLabel ? record.branchLabel : record.companyName}
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
        <div
          style={{
            fontSize: 'var(--fs-12)',
            color: 'var(--text-secondary)',
            fontWeight: 'var(--fw-400)',
            marginTop: 'var(--space-1)',
            fontFamily: 'ui-monospace, monospace',
          }}
        >
          GST {record.gst}
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
          href={`/admin/recruiters/${record.ticketId}`}
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
  );
}

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

function bucketCounts(records: readonly ApplicationTicketRecord[]): Map<string, number> {
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
