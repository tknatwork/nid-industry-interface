'use client';

import { useId, useState } from 'react';
import { Button, Field } from '@nid/ui';

/**
 * MobileVerify — mock mobile-number verification for the apply form (plan §G).
 *
 * Flow (entirely client-side, no real SMS):
 *   1. Recruiter types a phone number → "Send code".
 *   2. A fixed demo code is "sent" (shown inline as a hint).
 *   3. Recruiter enters the code → "Verify" → a green "Verified" badge.
 *
 * Verification soft-gates submit: the parent form disables submit until the
 * number is verified, but the recruiter can still edit the number (which
 * resets verification). The verified phone + flag are reported up via
 * `onChange` so the parent mirrors them into hidden inputs for the action.
 */

/** The one code the demo accepts. Surfaced in the UI so the demo is operable. */
export const DEMO_OTP = '424242';

export interface MobileVerifyProps {
  readonly initialPhone?: string;
  readonly error?: string | undefined;
  readonly onChange: (state: { phone: string; verified: boolean }) => void;
}

type Step = 'idle' | 'code-sent' | 'verified';

const badgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'var(--space-1)',
  backgroundColor: 'var(--pill-success-bg)',
  color: 'var(--pill-success-fg)',
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  padding: 'var(--space-1) var(--space-3)',
  borderRadius: 'var(--radius-full)',
};

const hintStyle = {
  fontSize: 'var(--fs-12)',
  color: 'var(--text-secondary)',
  lineHeight: 1.4,
};

export function MobileVerify({ initialPhone = '', error, onChange }: MobileVerifyProps) {
  const [phone, setPhone] = useState(initialPhone);
  const [step, setStep] = useState<Step>('idle');
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | undefined>(undefined);
  const codeId = useId();

  const phoneValid = /^[+0-9 ()-]{7,20}$/.test(phone.trim());

  function update(nextPhone: string, verified: boolean) {
    onChange({ phone: nextPhone, verified });
  }

  function handlePhoneChange(next: string) {
    setPhone(next);
    // Editing the number invalidates any prior verification.
    if (step !== 'idle') {
      setStep('idle');
      setCode('');
      setCodeError(undefined);
    }
    update(next, false);
  }

  function handleSendCode() {
    if (!phoneValid) return;
    setStep('code-sent');
    setCode('');
    setCodeError(undefined);
  }

  function handleVerify() {
    if (code.trim() === DEMO_OTP) {
      setStep('verified');
      setCodeError(undefined);
      update(phone, true);
    } else {
      setCodeError(`Incorrect code. For this demo, enter ${DEMO_OTP}.`);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 240px', minWidth: '220px' }}>
          <Field
            id="contactPhoneInput"
            label="Primary contact phone"
            required
            type="tel"
            autoComplete="tel"
            placeholder="+91 …"
            inputMode="tel"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            {...(error ? { error } : {})}
            trailing={step === 'verified' ? <span style={badgeStyle}>✓ Verified</span> : undefined}
          />
        </div>
        {step !== 'verified' && (
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleSendCode}
            disabled={!phoneValid}
          >
            {step === 'code-sent' ? 'Resend code' : 'Send code'}
          </Button>
        )}
      </div>

      {step === 'code-sent' && (
        <div
          style={{
            display: 'grid',
            gap: 'var(--space-3)',
            padding: 'var(--space-4)',
            backgroundColor: 'var(--surface-panel)',
            borderRadius: 'var(--radius-3)',
            border: '1px solid var(--border-default)',
          }}
        >
          <p style={hintStyle}>
            A 6-digit code was sent to <strong style={{ color: 'var(--text-strong)' }}>{phone.trim()}</strong> by
            SMS. <em>(Demo: nothing is sent — enter <strong>{DEMO_OTP}</strong>.)</em>
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 160px', minWidth: '160px' }}>
              <Field
                id={codeId}
                label="Verification code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="6-digit code"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (codeError) setCodeError(undefined);
                }}
                {...(codeError ? { error: codeError } : {})}
              />
            </div>
            <Button type="button" size="md" onClick={handleVerify} disabled={code.trim().length === 0}>
              Verify
            </Button>
          </div>
        </div>
      )}

      {step !== 'verified' && (
        <p style={hintStyle}>
          We verify your number so we can reach you about interview scheduling. Verification is required
          before you submit.
        </p>
      )}
    </div>
  );
}
