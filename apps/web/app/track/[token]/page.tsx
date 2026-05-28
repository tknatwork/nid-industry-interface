import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageShell, StatusPill } from '@nid/ui';
import {
  lookup,
  outboxFor,
  parseTokenId,
  recruiterStatusValues,
  type ApplicationTokenRecord,
  type RecruiterStatus,
  type StatusHistoryEntry,
} from '@nid/module-recruiter-onboarding';

interface PageParams {
  readonly token: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { token } = await params;
  return {
    title: `Tracker · ${token} · NID Industry Interface`,
    robots: { index: false, follow: false }, // tracker URLs include identifying token
  };
}

export default async function TrackerPage({ params }: { params: Promise<PageParams> }) {
  const { token } = await params;
  const tokenId = token.toUpperCase();
  if (!parseTokenId(tokenId)) notFound();

  const record = lookup(tokenId);
  if (!record) notFound();

  const messages = outboxFor(tokenId);

  return (
    <PageShell activeNav="track">
      <section
        style={{
          paddingInline: 'var(--layout-page-x)',
          paddingBlock: 'var(--layout-section-y)',
        }}
      >
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <Header record={record} />

          <Timeline record={record} />

          <NextStep record={record} />

          <CommsOutbox messages={messages} />
        </div>
      </section>
    </PageShell>
  );
}

function Header({ record }: { record: ApplicationTokenRecord }) {
  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-10)',
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
            marginBottom: 'var(--space-1)',
          }}
        >
          Application token
        </p>
        <p
          style={{
            fontSize: 'var(--fs-24)',
            lineHeight: 'var(--lh-28)',
            fontWeight: 'var(--fw-500)',
            color: 'var(--text-strong)',
            fontFamily: 'ui-monospace, monospace',
            marginBottom: 'var(--space-2)',
          }}
        >
          {record.tokenId}
        </p>
        <p
          style={{
            fontSize: 'var(--fs-18)',
            fontWeight: 'var(--fw-500)',
            color: 'var(--text-primary)',
          }}
        >
          {record.companyName} <span style={{ color: 'var(--text-secondary)' }}>· {record.sector}</span>
        </p>
      </div>
      <StatusPill tone={toneFor(record.status)}>{statusLabel(record.status)}</StatusPill>
    </header>
  );
}

function Timeline({ record }: { record: ApplicationTokenRecord }) {
  // Build the visual timeline against the canonical state machine so non-occurred
  // steps still render as upcoming dots — the recruiter sees the full journey.
  const orderedFlow: readonly RecruiterStatus[] = [
    'application-received',
    'verification-pending',
    'fee-due',
    'payment-received',
    'approved',
    'credentials-issued',
  ];
  const reachedIndex = orderedFlow.indexOf(record.status);
  const isRejected = record.status === 'rejected';
  const lastEntryByStatus = new Map<RecruiterStatus, StatusHistoryEntry>();
  for (const entry of record.statusHistory) {
    lastEntryByStatus.set(entry.status, entry);
  }

  return (
    <ol
      aria-label="Application progress"
      style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'grid',
        gap: 'var(--space-5)',
        marginBottom: 'var(--space-10)',
      }}
    >
      {orderedFlow.map((stage, index) => {
        const entry = lastEntryByStatus.get(stage);
        const isReached = !isRejected && entry !== undefined;
        const isCurrent = !isRejected && stage === record.status;
        const isFuture = !isRejected && index > reachedIndex;
        const dotColor = isCurrent
          ? 'var(--accent)'
          : isReached
            ? 'var(--green-500)'
            : 'var(--border-emphasized)';
        const labelColor = isFuture ? 'var(--text-secondary)' : 'var(--text-strong)';

        return (
          <li
            key={stage}
            style={{
              display: 'grid',
              gridTemplateColumns: '24px 1fr',
              gap: 'var(--space-4)',
              alignItems: 'start',
            }}
          >
            <div
              aria-hidden
              style={{
                position: 'relative',
                width: '24px',
                height: '100%',
              }}
            >
              {/* Line connector (drawn underneath the dot) */}
              {index < orderedFlow.length - 1 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '24px',
                    bottom: '-20px',
                    left: '11px',
                    width: '2px',
                    backgroundColor: isReached ? 'var(--green-500)' : 'var(--border-default)',
                  }}
                />
              )}
              <span
                style={{
                  display: 'inline-block',
                  width: '24px',
                  height: '24px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--surface-page)',
                  border: `3px solid ${dotColor}`,
                  boxShadow: isCurrent ? `0 0 0 4px color-mix(in oklch, ${dotColor}, white 70%)` : 'none',
                }}
              />
            </div>
            <div>
              <p
                style={{
                  fontSize: 'var(--fs-16)',
                  fontWeight: isCurrent ? 'var(--fw-600)' : 'var(--fw-500)',
                  color: labelColor,
                }}
              >
                {statusLabel(stage)}
              </p>
              {entry && (
                <p
                  style={{
                    fontSize: 'var(--fs-12)',
                    color: 'var(--text-secondary)',
                    marginTop: 'var(--space-1)',
                  }}
                >
                  <time dateTime={entry.at}>{formatHuman(entry.at)}</time>
                  {entry.note ? <> &mdash; {entry.note}</> : null}
                </p>
              )}
              {!entry && (
                <p
                  style={{
                    fontSize: 'var(--fs-12)',
                    color: 'var(--text-secondary)',
                    marginTop: 'var(--space-1)',
                  }}
                >
                  Awaiting this step.
                </p>
              )}
            </div>
          </li>
        );
      })}
      {isRejected && (
        <li
          style={{
            backgroundColor: 'var(--pill-danger-bg)',
            color: 'var(--pill-danger-fg)',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-3)',
          }}
        >
          Application rejected. Reach out to industry@nid.edu to appeal.
        </li>
      )}
      {/* Sanity reference — keeps `recruiterStatusValues` used so the import isn't pruned */}
      <li hidden>{recruiterStatusValues.length} canonical states tracked.</li>
    </ol>
  );
}

function NextStep({ record }: { record: ApplicationTokenRecord }) {
  const guidance: Record<RecruiterStatus, string> = {
    'application-received': 'Nothing required from you. We will reach out within 3 working days.',
    'verification-pending': 'Nothing required from you. Verification typically takes 24-48 hours.',
    'fee-due':
      `Pay the participation fee of ₹${rupeeFromPaise(record.feeAmountPaise ?? 0)} via the link in the invoice email.`,
    'payment-received': 'Nothing required from you. Final admin approval is in progress.',
    'approved': 'Credentials are being prepared. You will receive them by email within 1 working day.',
    'credentials-issued': 'You can log in now and post your first JD.',
    'rejected': 'Reach out to industry@nid.edu to discuss the next steps.',
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--surface-card)',
        border: '1px solid var(--card-border)',
        borderRadius: 'var(--card-radius)',
        padding: 'var(--card-padding)',
        marginBottom: 'var(--space-10)',
      }}
    >
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
        Next step
      </p>
      <p
        style={{
          fontSize: 'var(--fs-16)',
          color: 'var(--text-strong)',
          lineHeight: 1.5,
        }}
      >
        {guidance[record.status]}
      </p>
    </div>
  );
}

function CommsOutbox({
  messages,
}: {
  messages: ReadonlyArray<{ id: string; channel: string; to: string; templateId: string; renderedSubject?: string; renderedBody: string; queuedAt: string }>;
}) {
  if (messages.length === 0) return null;
  return (
    <section
      style={{
        backgroundColor: 'var(--surface-panel)',
        borderRadius: 'var(--card-radius)',
        padding: 'var(--card-padding)',
      }}
    >
      <p
        style={{
          fontSize: 'var(--fs-12)',
          fontWeight: 'var(--fw-600)',
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 'var(--space-3)',
        }}
      >
        Comms log (this prototype previews emails; nothing was sent)
      </p>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 'var(--space-4)' }}>
        {messages.map((m) => (
          <li
            key={m.id}
            style={{
              backgroundColor: 'var(--surface-card)',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-2)',
              border: '1px solid var(--border-default)',
            }}
          >
            <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
              {m.channel.toUpperCase()} to {m.to} &middot; <time dateTime={m.queuedAt}>{formatHuman(m.queuedAt)}</time>
            </p>
            {m.renderedSubject && (
              <p style={{ fontSize: 'var(--fs-16)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)' }}>
                {m.renderedSubject}
              </p>
            )}
            <pre
              style={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'inherit',
                fontSize: 'var(--fs-14)',
                color: 'var(--text-primary)',
                marginTop: 'var(--space-2)',
                lineHeight: 1.5,
              }}
            >
              {m.renderedBody}
            </pre>
          </li>
        ))}
      </ul>
    </section>
  );
}

function statusLabel(status: RecruiterStatus): string {
  switch (status) {
    case 'application-received':
      return 'Application received';
    case 'verification-pending':
      return 'Verification in progress';
    case 'fee-due':
      return 'Payment due';
    case 'payment-received':
      return 'Payment received';
    case 'approved':
      return 'Approved';
    case 'credentials-issued':
      return 'Credentials issued';
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
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function rupeeFromPaise(paise: number): string {
  return (paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}
