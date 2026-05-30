import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AdminShell, Button, Field, StatusPill } from '@nid/ui';
import {
  lookup,
  outboxFor,
  parseTicketId,
  type ApplicationTicketRecord,
  type RecruiterStatus,
  type StatusHistoryEntry,
} from '@nid/module-recruiter-onboarding';
import { PARENT_COMPANIES } from '~/lib/recruiter-public';
import { advanceTicketAction } from './actions';

interface PageParams {
  readonly ticketId: string;
}

interface SearchParams {
  readonly error?: string;
}

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { ticketId } = await params;
  return {
    title: `Review ${ticketId} · Admin · NID Industry Interface`,
    robots: { index: false, follow: false },
  };
}

const NEXT_STATUSES: Readonly<Record<RecruiterStatus, readonly RecruiterStatus[]>> = {
  'application-received': ['verification-pending', 'rejected'],
  'verification-pending': ['fee-due', 'rejected'],
  'fee-due': ['payment-received'],
  'payment-received': ['approved'],
  'approved': ['credentials-issued'],
  'credentials-issued': [],
  'rejected': [],
};

export default async function AdminTicketDetail({
  params,
  searchParams,
}: {
  params: Promise<PageParams>;
  searchParams: Promise<SearchParams>;
}) {
  const { ticketId: raw } = await params;
  const ticketId = raw.toUpperCase();
  if (!parseTicketId(ticketId)) notFound();
  const record = lookup(ticketId);
  if (!record) notFound();
  const queryError = (await searchParams).error;
  const messages = outboxFor(ticketId);

  const nextStatuses = NEXT_STATUSES[record.status];

  return (
    <AdminShell activeNav="queue" roleLabel="Placement head · NID Ahmedabad">
      <section
        style={{
          paddingInline: 'var(--layout-page-x)',
          paddingBlock: 'var(--space-10)',
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <a
            href="/admin/recruiters/queue"
            style={{
              fontSize: 'var(--fs-12)',
              fontWeight: 'var(--fw-600)',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              textDecoration: 'none',
              display: 'inline-block',
              marginBottom: 'var(--space-4)',
            }}
          >
            ← Queue
          </a>

          <Header record={record} />

          {queryError && (
            <p
              role="alert"
              style={{
                marginBottom: 'var(--space-6)',
                padding: 'var(--space-4)',
                backgroundColor: 'var(--pill-danger-bg)',
                color: 'var(--pill-danger-fg)',
                borderRadius: 'var(--radius-3)',
                fontWeight: 'var(--fw-600)',
              }}
            >
              {errorLabel(queryError)}
            </p>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
              gap: 'var(--space-8)',
            }}
          >
            <div>
              <Section title="Company">
                {record.branchLabel && <Detail label="Branch" value={record.branchLabel} />}
                <Detail label="Sector" value={record.sector} />
                <Detail label="GST" value={record.gst} mono />
                <Detail label="Registration" value={record.registrationNumber} mono />
                {record.websiteUrl && <Detail label="Website" value={record.websiteUrl} />}
              </Section>

              <Section title="Primary contact">
                <Detail label="Name" value={record.contactName} />
                <Detail label="Email" value={record.corporateEmail} mono />
                <Detail
                  label="Phone"
                  value={record.phoneVerified ? `${record.contactPhone} · verified` : record.contactPhone}
                  mono
                />
              </Section>

              {record.receipt && (
                <Section title="Payment receipt">
                  <Detail label="Receipt" value={record.receipt.receiptId} mono />
                  <Detail
                    label="Amount"
                    value={`₹${(record.receipt.amountPaise / 100).toLocaleString('en-IN')}`}
                  />
                  <Detail label="Method" value={record.receipt.method} />
                  <Detail label="Gateway ref" value={record.receipt.gatewayRef} mono />
                </Section>
              )}

              <Section title="History">
                <ol
                  aria-label="Status history"
                  style={{
                    listStyle: 'none',
                    margin: 0,
                    padding: 0,
                    display: 'grid',
                    gap: 'var(--space-3)',
                  }}
                >
                  {record.statusHistory.map((entry, index) => (
                    <HistoryRow key={`${entry.at}-${index}`} entry={entry} />
                  ))}
                </ol>
              </Section>
            </div>

            <aside>
              <Section title="Advance">
                {nextStatuses.length === 0 ? (
                  <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)' }}>
                    Terminal state. No further admin transition available.
                  </p>
                ) : (
                  <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
                    {nextStatuses.map((toStatus) => (
                      <AdvanceForm
                        key={toStatus}
                        ticketId={record.ticketId}
                        fromStatus={record.status}
                        toStatus={toStatus}
                        hint={hintFor(record.status, toStatus)}
                        showFee={record.status === 'verification-pending' && toStatus === 'fee-due'}
                        defaultFeePaise={record.feeAmountPaise ?? 1_500_000}
                      />
                    ))}
                  </div>
                )}
              </Section>

              {messages.length > 0 && (
                <Section title="Comms log">
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 'var(--space-3)' }}>
                    {messages.map((m) => (
                      <li
                        key={m.id}
                        style={{
                          backgroundColor: 'var(--surface-card)',
                          padding: 'var(--space-3)',
                          borderRadius: 'var(--radius-2)',
                          border: '1px solid var(--border-default)',
                          fontSize: 'var(--fs-12)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        <strong style={{ color: 'var(--text-strong)' }}>
                          {m.channel.toUpperCase()}
                        </strong>{' '}
                        to {m.to}
                        <div style={{ marginTop: 'var(--space-1)' }}>{m.renderedSubject ?? m.renderedBody}</div>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
            </aside>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}

function Header({ record }: { record: ApplicationTicketRecord }) {
  // Multi-branch grouping (plan Round 3 §D): when this ticket is one branch of a
  // parent company, name the parent + this branch so the admin sees it is one of
  // several SEPARATE accounts under that company.
  const parent = record.parentCompanyId != null ? PARENT_COMPANIES[record.parentCompanyId] : undefined;
  return (
    <header
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'var(--space-4)',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 'var(--space-8)',
        paddingBottom: 'var(--space-6)',
        borderBottom: '1px solid var(--border-default)',
      }}
    >
      <div>
        <p
          style={{
            fontSize: 'var(--fs-12)',
            fontWeight: 'var(--fw-600)',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          Application ticket
        </p>
        <p
          style={{
            fontSize: 'var(--fs-24)',
            fontWeight: 'var(--fw-500)',
            color: 'var(--text-strong)',
            fontFamily: 'ui-monospace, monospace',
            marginTop: 'var(--space-1)',
          }}
        >
          {record.ticketId}
        </p>
        <p
          style={{
            fontSize: 'var(--fs-20)',
            fontWeight: 'var(--fw-500)',
            color: 'var(--text-strong)',
            marginTop: 'var(--space-2)',
          }}
        >
          {record.companyName}
        </p>
        {parent && (
          <p
            style={{
              fontSize: 'var(--fs-12)',
              color: 'var(--text-secondary)',
              marginTop: 'var(--space-1)',
            }}
          >
            Part of{' '}
            <a
              href="/admin/recruiters/queue"
              style={{ color: 'var(--accent)', fontWeight: 'var(--fw-600)', textDecoration: 'none' }}
            >
              {parent.name}
            </a>
            {record.branchLabel ? ` · ${record.branchLabel} branch` : ''} · separate account
          </p>
        )}
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
        <a
          href={`/track/${record.ticketId}`}
          style={{
            fontSize: 'var(--fs-12)',
            color: 'var(--accent)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontWeight: 'var(--fw-600)',
            textDecoration: 'none',
          }}
        >
          View recruiter tracker ↗
        </a>
        <StatusPill tone={toneFor(record.status)}>{statusLabel(record.status)}</StatusPill>
      </div>
    </header>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        backgroundColor: 'var(--surface-card)',
        border: '1px solid var(--card-border)',
        borderRadius: 'var(--card-radius)',
        padding: 'var(--card-padding-loose)',
        marginBottom: 'var(--space-6)',
      }}
    >
      <h2
        style={{
          fontSize: 'var(--fs-12)',
          fontWeight: 'var(--fw-600)',
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 'var(--space-4)',
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <p style={{ marginBottom: 'var(--space-3)' }}>
      <span
        style={{
          fontSize: 'var(--fs-12)',
          fontWeight: 'var(--fw-600)',
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          display: 'block',
          marginBottom: 'var(--space-1)',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 'var(--fs-16)',
          color: 'var(--text-strong)',
          fontFamily: mono ? 'ui-monospace, monospace' : 'var(--ff-sans)',
        }}
      >
        {value}
      </span>
    </p>
  );
}

function HistoryRow({ entry }: { entry: StatusHistoryEntry }) {
  return (
    <li
      style={{
        display: 'grid',
        gridTemplateColumns: '160px 1fr',
        gap: 'var(--space-4)',
        padding: 'var(--space-3)',
        borderRadius: 'var(--radius-2)',
        backgroundColor: 'var(--surface-page)',
        border: '1px solid var(--border-default)',
      }}
    >
      <div>
        <StatusPill tone={toneFor(entry.status)}>{statusLabel(entry.status)}</StatusPill>
        <p
          style={{
            fontSize: 'var(--fs-12)',
            color: 'var(--text-secondary)',
            marginTop: 'var(--space-2)',
          }}
        >
          <time dateTime={entry.at}>{formatHuman(entry.at)}</time>
        </p>
      </div>
      <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-strong)' }}>
        {entry.note ?? <span style={{ color: 'var(--text-secondary)' }}>(no note)</span>}
      </p>
    </li>
  );
}

function AdvanceForm({
  ticketId,
  fromStatus,
  toStatus,
  hint,
  showFee,
  defaultFeePaise,
}: {
  ticketId: string;
  fromStatus: RecruiterStatus;
  toStatus: RecruiterStatus;
  hint: string;
  showFee?: boolean;
  defaultFeePaise?: number;
}) {
  const isRejection = toStatus === 'rejected';
  return (
    <form
      action={advanceTicketAction}
      style={{
        display: 'grid',
        gap: 'var(--space-3)',
        padding: 'var(--space-4)',
        borderRadius: 'var(--radius-2)',
        backgroundColor: 'var(--surface-page)',
        border: '1px solid var(--border-default)',
      }}
    >
      <input type="hidden" name="ticketId" value={ticketId} />
      <input type="hidden" name="fromStatus" value={fromStatus} />
      <input type="hidden" name="toStatus" value={toStatus} />
      <p style={{ fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)' }}>
        → {statusLabel(toStatus)}
      </p>
      <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {hint}
      </p>
      <Field
        id={`note-${toStatus}`}
        name="note"
        label="Note"
        placeholder={isRejection ? 'Reason (required)' : 'Optional note for the recruiter'}
        required={isRejection}
      />
      {showFee && (
        <Field
          id={`fee-${toStatus}`}
          name="feeAmountPaise"
          label="Fee (paise)"
          type="number"
          min={0}
          step={100}
          defaultValue={defaultFeePaise}
          help={`Default ₹${((defaultFeePaise ?? 0) / 100).toLocaleString('en-IN')}.`}
        />
      )}
      <div>
        <Button type="submit" variant={isRejection ? 'secondary' : 'primary'} size="sm">
          {actionLabel(toStatus)}
        </Button>
      </div>
    </form>
  );
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

function actionLabel(toStatus: RecruiterStatus): string {
  switch (toStatus) {
    case 'verification-pending':
      return 'Begin verification';
    case 'fee-due':
      return 'Issue invoice';
    case 'payment-received':
      return 'Mark payment received';
    case 'approved':
      return 'Approve';
    case 'credentials-issued':
      return 'Issue credentials';
    case 'rejected':
      return 'Reject';
    default:
      return 'Advance';
  }
}

function hintFor(fromStatus: RecruiterStatus, toStatus: RecruiterStatus): string {
  if (toStatus === 'rejected') {
    return 'Reject the application. The recruiter will see the rejection reason on their tracker page.';
  }
  switch (toStatus) {
    case 'verification-pending':
      return 'Start vetting the company. Confirm GST + corporate email + history.';
    case 'fee-due':
      return 'Vetting passed — issue the participation-fee invoice. Recruiter will pay through the gateway.';
    case 'payment-received':
      return 'Confirm payment received. Final admin approval comes next.';
    case 'approved':
      return 'Final approval — credentials will be minted on the next step.';
    case 'credentials-issued':
      return 'Mint and email login credentials. Onboarding complete.';
    default:
      return `Advance from ${fromStatus}.`;
  }
}

function errorLabel(error: string): string {
  switch (error) {
    case 'missing':
      return 'Missing required field for the transition.';
    case 'invalid-status':
      return 'Invalid status value submitted.';
    case 'illegal-transition':
      return 'That transition is not allowed from the current state.';
    case 'not-found':
      return 'Ticket not found.';
    default:
      return 'Could not advance the ticket. Try again.';
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
