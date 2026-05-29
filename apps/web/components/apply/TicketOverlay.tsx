'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, Overlay, StatusPill } from '@nid/ui';
import type { PaymentReceipt, RecruiterStatus } from '@nid/module-recruiter-onboarding';
import { payTicketAction } from '@/apply/actions';
import type { IssuedTicket } from '@/apply/state';
import { PaymentScreen } from './PaymentScreen';
import { Receipt } from './Receipt';

/**
 * TicketOverlay — the post-submit overlay for the apply flow (plan §G).
 *
 * Sequence inside a single Overlay (modal) atom:
 *   ticket   → issued ticket id + status + "Pay participation fee" CTA
 *   payment  → demo payment screen (mock gateway)
 *   receipt  → generated receipt (mapped to the ticket, "sent" to email + SMS)
 *              → CTA swaps to "Track progress" → /track/<ticket>
 *
 * Closing the overlay before paying still lets the recruiter track later; the
 * ticket already persists server-side via the submit action.
 */

type Step = 'ticket' | 'payment' | 'receipt';

export interface TicketOverlayProps {
  readonly open: boolean;
  readonly ticket: IssuedTicket;
  readonly onClose: () => void;
}

const TONE_BY_STATUS: Record<RecruiterStatus, 'neutral' | 'info' | 'success' | 'warning' | 'danger'> = {
  'application-received': 'info',
  'verification-pending': 'info',
  'fee-due': 'warning',
  'payment-received': 'info',
  approved: 'success',
  'credentials-issued': 'success',
  rejected: 'danger',
};

const STATUS_LABEL: Record<RecruiterStatus, string> = {
  'application-received': 'Application received',
  'verification-pending': 'Verification in progress',
  'fee-due': 'Payment due',
  'payment-received': 'Payment received',
  approved: 'Approved',
  'credentials-issued': 'Credentials issued',
  rejected: 'Rejected',
};

const labelTextStyle = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
};

function rupeeFromPaise(paise: number): string {
  return (paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

export function TicketOverlay({ open, ticket, onClose }: TicketOverlayProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('ticket');
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);

  const title =
    step === 'ticket'
      ? 'Application submitted'
      : step === 'payment'
        ? 'Pay participation fee'
        : 'Fee receipt';

  async function handlePay(methodLabel: string) {
    const minted = await payTicketAction({
      ticketId: ticket.ticketId,
      amountPaise: ticket.feeAmountPaise,
      method: methodLabel,
    });
    setReceipt(minted);
    setStep('receipt');
  }

  function handleTrack() {
    router.push(ticket.trackerPath);
  }

  return (
    <Overlay open={open} onClose={onClose} title={title} width="640px">
      {step === 'ticket' && (
        <div style={{ display: 'grid', gap: 'var(--space-5)' }}>
          <p style={{ fontSize: 'var(--fs-16)', color: 'var(--text-primary)', lineHeight: 1.5 }}>
            Thanks, {ticket.contactName.split(' ')[0]}. Your application for{' '}
            <strong style={{ color: 'var(--text-strong)' }}>{ticket.companyName}</strong> is in. We&rsquo;ve
            sent your ticket to <strong style={{ color: 'var(--text-strong)' }}>{ticket.corporateEmail}</strong>{' '}
            and by SMS to <strong style={{ color: 'var(--text-strong)' }}>{ticket.contactPhone}</strong>.
          </p>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 'var(--space-4)',
              flexWrap: 'wrap',
              padding: 'var(--card-padding)',
              backgroundColor: 'var(--surface-panel)',
              borderRadius: 'var(--card-radius)',
            }}
          >
            <div>
              <p style={labelTextStyle}>Your ticket</p>
              <p
                style={{
                  fontSize: 'var(--fs-24)',
                  fontWeight: 'var(--fw-600)',
                  color: 'var(--text-strong)',
                  fontFamily: 'ui-monospace, monospace',
                  marginTop: 'var(--space-1)',
                }}
              >
                {ticket.ticketId}
              </p>
            </div>
            <StatusPill tone={TONE_BY_STATUS[ticket.status]}>{STATUS_LABEL[ticket.status]}</StatusPill>
          </div>

          <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-primary)', lineHeight: 1.5 }}>
            To confirm your slot for this cycle, pay the participation fee of{' '}
            <strong style={{ color: 'var(--text-strong)' }}>₹{rupeeFromPaise(ticket.feeAmountPaise)}</strong>{' '}
            now. You can also pay later from your tracker.
          </p>

          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
            <Button type="button" size="lg" onClick={() => setStep('payment')}>
              Pay participation fee
            </Button>
            <Button type="button" variant="ghost" size="md" onClick={handleTrack}>
              Track progress
            </Button>
          </div>
        </div>
      )}

      {step === 'payment' && (
        <PaymentScreen
          ticketId={ticket.ticketId}
          amountPaise={ticket.feeAmountPaise}
          onPay={handlePay}
          onCancel={() => setStep('ticket')}
        />
      )}

      {step === 'receipt' && receipt && (
        <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
          <Receipt
            receipt={receipt}
            ticketId={ticket.ticketId}
            sentToEmail={ticket.corporateEmail}
            sentToPhone={ticket.contactPhone}
          />
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
            <Button type="button" size="lg" onClick={handleTrack}>
              Track progress
            </Button>
            <Button type="button" variant="ghost" size="md" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      )}
    </Overlay>
  );
}
