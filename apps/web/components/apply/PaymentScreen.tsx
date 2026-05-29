'use client';

import { useState } from 'react';
import { Button, Field } from '@nid/ui';

/**
 * PaymentScreen — demo participation-fee payment surface for the post-submit
 * overlay (plan §G). Pure mock: no real gateway, no card capture, no PFMS.
 * The recruiter picks a method, enters throwaway demo details, and "pays" —
 * the parent then calls the server action that mints the receipt.
 */

export type PayMethodKind = 'upi' | 'card' | 'netbanking';

export interface PaymentScreenProps {
  readonly ticketId: string;
  readonly amountPaise: number;
  /** Async so the parent can show a spinner; resolves once the receipt is minted. */
  readonly onPay: (methodLabel: string) => Promise<void> | void;
  readonly onCancel: () => void;
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

export function PaymentScreen({ ticketId, amountPaise, onPay, onCancel }: PaymentScreenProps) {
  const [method, setMethod] = useState<PayMethodKind>('upi');
  const [vpa, setVpa] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [bank, setBank] = useState('');
  const [paying, setPaying] = useState(false);

  const active = METHODS.find((m) => m.kind === method) ?? METHODS[0]!;

  async function handlePay() {
    setPaying(true);
    try {
      await onPay(active.gatewayLabel);
    } finally {
      // The parent swaps the overlay step on success; if it didn't (error path),
      // re-enable the button so the demo isn't stuck.
      setPaying(false);
    }
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
            Participation fee
          </p>
          <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
            Ticket{' '}
            <span style={{ fontFamily: 'ui-monospace, monospace', color: 'var(--text-strong)' }}>{ticketId}</span>
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

      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
        <Button type="button" size="lg" onClick={handlePay} disabled={paying}>
          {paying ? 'Processing…' : `Pay ₹${rupeeFromPaise(amountPaise)}`}
        </Button>
        <Button type="button" variant="ghost" size="md" onClick={onCancel} disabled={paying}>
          Later
        </Button>
      </div>

      <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        This is a mock payment screen for the prototype. No real gateway is contacted and no money moves.
      </p>
    </div>
  );
}
