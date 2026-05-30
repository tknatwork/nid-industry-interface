'use client';

import type { PaymentReceipt } from '@nid/module-recruiter-onboarding';

/**
 * Receipt — renders a generated participation-fee receipt inside the post-submit
 * overlay (plan §G). Reuses recruiter-onboarding's `PaymentReceipt` shape verbatim
 * (receiptId, amountPaise, paidAt, method, gatewayRef) so the demo receipt is
 * identical to the one the tracker / `/recruiter/receipts` will surface.
 *
 * Also confirms the receipt was "sent" to the recruiter's corporate email and
 * primary phone (SMS) via the onboarding outbox — mocked, nothing leaves.
 */

export interface ReceiptProps {
  readonly receipt: PaymentReceipt;
  readonly ticketId: string;
  readonly sentToEmail: string;
  readonly sentToPhone: string;
}

const rowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 'var(--space-4)',
  fontSize: 'var(--fs-14)',
  paddingBlock: 'var(--space-2)',
  borderBottom: '1px solid var(--border-default)',
};

const labelStyle = { color: 'var(--text-secondary)' };
const valueStyle = { color: 'var(--text-strong)', fontWeight: 'var(--fw-500)', textAlign: 'right' as const };
const monoValueStyle = { ...valueStyle, fontFamily: 'ui-monospace, monospace' };

function rupeeFromPaise(paise: number): string {
  return (paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function formatHuman(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function Receipt({ receipt, ticketId, sentToEmail, sentToPhone }: ReceiptProps) {
  return (
    <div style={{ display: 'grid', gap: 'var(--space-5)' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          padding: 'var(--space-4)',
          backgroundColor: 'var(--pill-success-bg)',
          color: 'var(--pill-success-fg)',
          borderRadius: 'var(--radius-3)',
        }}
      >
        <span aria-hidden style={{ fontSize: 'var(--fs-20)' }}>✓</span>
        <p style={{ fontSize: 'var(--fs-16)', fontWeight: 'var(--fw-600)' }}>
          Payment received. Receipt generated.
        </p>
      </div>

      <div
        style={{
          border: '1px solid var(--card-border)',
          borderRadius: 'var(--card-radius)',
          padding: 'var(--card-padding)',
          backgroundColor: 'var(--surface-card)',
        }}
      >
        <div style={rowStyle}>
          <span style={labelStyle}>Receipt no.</span>
          <span style={monoValueStyle}>{receipt.receiptId}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>For ticket</span>
          <span style={monoValueStyle}>{ticketId}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>Amount paid</span>
          <span style={valueStyle}>₹{rupeeFromPaise(receipt.amountPaise)}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>Method</span>
          <span style={valueStyle}>{receipt.method}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>Gateway ref</span>
          <span style={monoValueStyle}>{receipt.gatewayRef}</span>
        </div>
        <div style={{ ...rowStyle, borderBottom: 'none' }}>
          <span style={labelStyle}>Paid at</span>
          <span style={valueStyle}>{formatHuman(receipt.paidAt)}</span>
        </div>
      </div>

      <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        A copy of this receipt was sent to{' '}
        <strong style={{ color: 'var(--text-strong)' }}>{sentToEmail}</strong> and by SMS to{' '}
        <strong style={{ color: 'var(--text-strong)' }}>{sentToPhone}</strong>.{' '}
        <em>This prototype previews emails &amp; SMS; nothing was actually sent. No real payment gateway
        was used.</em>
      </p>
    </div>
  );
}
