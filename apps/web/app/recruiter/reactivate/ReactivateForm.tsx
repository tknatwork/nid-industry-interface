'use client';

import { useState } from 'react';
import { Button, Field } from '@nid/ui';
import type { PaymentReceipt } from '@nid/module-recruiter-onboarding';
import { Receipt } from '~/components/apply/Receipt';
import { reactivateAction } from './actions';

/**
 * ReactivateForm — the demo participation-fee payment surface for re-activating a
 * locked recruiter account (plan Round 3 §C). Reuses the apply flow's demo-gateway
 * styling (method segments + throwaway Field) and its `Receipt` atom verbatim, so
 * the re-pay screen matches the post-submit payment the recruiter saw at intake.
 *
 * Two steps inside one card:
 *   pay      → demo gateway (method picker + mock detail) → "Pay ₹15,000"
 *   receipt  → minted `PaymentReceipt` ("sent" to email + SMS) → back to dashboard
 *
 * Pure mock: `reactivateAction` calls the module's `reactivateForCycle`, which
 * mints the receipt, unlocks the account, and moves it to the next cycle. No real
 * gateway, no money moves.
 */

type Step = 'pay' | 'receipt';

type PayMethodKind = 'upi' | 'card' | 'netbanking';

export interface ReactivateFormProps {
  readonly recruiterId: string;
  readonly nextCycleId: string;
  readonly nextCycleLabel: string;
  readonly amountPaise: number;
  /** Recruiter's corporate email — the receipt confirms it was "sent" here. */
  readonly sentToEmail: string;
  /** Recruiter's primary phone — the receipt confirms an SMS copy went here. */
  readonly sentToPhone: string;
}

const METHODS: ReadonlyArray<{ kind: PayMethodKind; label: string; gatewayLabel: string }> = [
  { kind: 'upi', label: 'UPI', gatewayLabel: 'Demo gateway (UPI)' },
  { kind: 'card', label: 'Card', gatewayLabel: 'Demo gateway (Card)' },
  { kind: 'netbanking', label: 'Net banking', gatewayLabel: 'Demo gateway (Net banking)' },
];

const segmentBase = {
  flex: '1 1 0',
  padding: 'var(--space-3) var(--space-4)',
  fontSize: 'var(--fs-14)',
  fontWeight: 'var(--fw-500)',
  borderRadius: 'var(--radius-2)',
  border: '1px solid var(--border-default)',
  background: 'transparent',
  color: 'var(--text-primary)',
  cursor: 'pointer',
  transition: 'background-color var(--motion-micro), border-color var(--motion-micro)',
};

const segmentActive = {
  ...segmentBase,
  borderColor: 'var(--accent)',
  backgroundColor: 'color-mix(in oklch, var(--accent), white 88%)',
  color: 'var(--text-strong)',
  fontWeight: 'var(--fw-600)',
};

function rupeeFromPaise(paise: number): string {
  return (paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

export function ReactivateForm({
  recruiterId,
  nextCycleId,
  nextCycleLabel,
  amountPaise,
  sentToEmail,
  sentToPhone,
}: ReactivateFormProps) {
  const [step, setStep] = useState<Step>('pay');
  const [method, setMethod] = useState<PayMethodKind>('upi');
  const [vpa, setVpa] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [bank, setBank] = useState('');
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);

  async function handlePay() {
    setPaying(true);
    setError(null);
    try {
      const outcome = await reactivateAction({ recruiterId, nextCycleId, amountPaise });
      if (outcome.ok && outcome.receipt) {
        setReceipt(outcome.receipt);
        setStep('receipt');
      } else {
        setError(outcome.reason ?? 'We could not reactivate your account. Please try again.');
      }
    } finally {
      setPaying(false);
    }
  }

  if (step === 'receipt' && receipt) {
    return (
      <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
        <Receipt
          receipt={receipt}
          ticketId={recruiterId}
          sentToEmail={sentToEmail}
          sentToPhone={sentToPhone}
        />
        <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-primary)', lineHeight: 1.5 }}>
          Your account is active again for <strong style={{ color: 'var(--text-strong)' }}>{nextCycleLabel}</strong>.
          Your existing login is unchanged.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
          <a href="/recruiter/dashboard" style={{ textDecoration: 'none' }}>
            <Button size="lg">Back to dashboard</Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 'var(--space-5)' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 'var(--space-4)',
          padding: 'var(--card-padding)',
          backgroundColor: 'var(--surface-panel)',
          borderRadius: 'var(--card-radius)',
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
            Participation fee · {nextCycleLabel}
          </p>
          <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
            Account{' '}
            <span style={{ fontFamily: 'ui-monospace, monospace', color: 'var(--text-strong)' }}>{recruiterId}</span>
          </p>
        </div>
        <p style={{ fontSize: 'var(--fs-24)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)' }}>
          ₹{rupeeFromPaise(amountPaise)}
        </p>
      </div>

      <fieldset style={{ border: 'none', margin: 0, padding: 0, display: 'grid', gap: 'var(--space-3)' }}>
        <legend
          style={{
            fontSize: 'var(--fs-12)',
            fontWeight: 'var(--fw-600)',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 'var(--space-2)',
          }}
        >
          Payment method
        </legend>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          {METHODS.map((m) => (
            <button
              key={m.kind}
              type="button"
              aria-pressed={method === m.kind}
              onClick={() => setMethod(m.kind)}
              style={method === m.kind ? segmentActive : segmentBase}
            >
              {m.label}
            </button>
          ))}
        </div>
      </fieldset>

      {method === 'upi' && (
        <Field
          id="demoVpa"
          label="UPI ID"
          placeholder="name@bank"
          autoComplete="off"
          value={vpa}
          onChange={(e) => setVpa(e.target.value)}
          help="Demo only — any value works. No collect request is raised."
        />
      )}
      {method === 'card' && (
        <Field
          id="demoCard"
          label="Card number"
          placeholder="4242 4242 4242 4242"
          inputMode="numeric"
          autoComplete="off"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
          help="Demo only — no card is captured or charged."
        />
      )}
      {method === 'netbanking' && (
        <Field
          id="demoBank"
          label="Bank"
          placeholder="e.g. State Bank of India"
          autoComplete="off"
          value={bank}
          onChange={(e) => setBank(e.target.value)}
          help="Demo only — you are not redirected to any bank."
        />
      )}

      {error && (
        <p
          role="alert"
          style={{ fontSize: 'var(--fs-14)', color: 'var(--input-error-text)', fontWeight: 'var(--fw-600)' }}
        >
          {error}
        </p>
      )}

      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
        <Button type="button" size="lg" onClick={handlePay} disabled={paying}>
          {paying ? 'Processing…' : `Pay ₹${rupeeFromPaise(amountPaise)}`}
        </Button>
        <a href="/recruiter/dashboard" style={{ textDecoration: 'none' }}>
          <Button type="button" variant="ghost" size="md" disabled={paying}>
            Later
          </Button>
        </a>
      </div>

      <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        This is a mock payment screen for the prototype. No real gateway is contacted and no money moves.
        The participation fee is non-refundable once the cycle opens.
      </p>
    </div>
  );
}
