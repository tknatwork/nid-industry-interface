'use client';

import { useActionState, useEffect, useState } from 'react';
import { Button, Field } from '@nid/ui';
import { MobileVerify } from '~/components/apply/MobileVerify';
import { TicketOverlay } from '~/components/apply/TicketOverlay';
import { submitApplyAction } from './actions';
import { initialApplyState, type ApplyFormState } from './state';

export function ApplyForm() {
  const [state, formAction, pending] = useActionState<ApplyFormState, FormData>(
    submitApplyAction,
    initialApplyState,
  );

  // Phone + verification live in client state (driven by MobileVerify) and are
  // mirrored into hidden inputs so the server action receives them.
  const [phone, setPhone] = useState(state.values['contactPhone'] ?? '');
  const [phoneVerified, setPhoneVerified] = useState(false);

  // The post-submit Ticket Overlay is open whenever the action returns a ticket.
  const [overlayOpen, setOverlayOpen] = useState(false);
  useEffect(() => {
    if (state.status === 'submitted' && state.ticket) setOverlayOpen(true);
  }, [state.status, state.ticket]);

  return (
    <>
      <form
        action={formAction}
        noValidate
        style={{
          display: 'grid',
          gap: 'var(--space-5)',
        }}
      >
        <input type="hidden" name="cycleId" value="cycle_spring_2026" />
        {/* Mirrored from MobileVerify so the action gets the verified phone + flag. */}
        <input type="hidden" name="contactPhone" value={phone} />
        <input type="hidden" name="phoneVerified" value={phoneVerified ? 'true' : 'false'} />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--space-5)',
          }}
        >
          <Field
            id="companyName"
            name="companyName"
            label="Company name"
            required
            autoComplete="organization"
            defaultValue={state.values['companyName'] ?? ''}
            error={state.fieldErrors['companyName']?.[0]}
          />
          <Field
            id="sector"
            name="sector"
            label="Sector"
            required
            placeholder="e.g. Consumer Electronics"
            defaultValue={state.values['sector'] ?? ''}
            error={state.fieldErrors['sector']?.[0]}
          />
          <Field
            id="gst"
            name="gst"
            label="GST number"
            required
            placeholder="15 alphanumeric characters"
            minLength={15}
            maxLength={15}
            style={{ textTransform: 'uppercase' }}
            defaultValue={state.values['gst'] ?? ''}
            error={state.fieldErrors['gst']?.[0]}
          />
          <Field
            id="registrationNumber"
            name="registrationNumber"
            label="Company registration number"
            required
            placeholder="CIN / LLP / society registration"
            defaultValue={state.values['registrationNumber'] ?? ''}
            error={state.fieldErrors['registrationNumber']?.[0]}
          />
        </div>

        <Field
          id="corporateEmail"
          name="corporateEmail"
          label="Corporate email"
          type="email"
          required
          autoComplete="email"
          help="Use your company domain. Personal addresses (Gmail, Yahoo, Outlook) are not accepted."
          defaultValue={state.values['corporateEmail'] ?? ''}
          error={state.fieldErrors['corporateEmail']?.[0]}
        />

        <Field
          id="websiteUrl"
          name="websiteUrl"
          label="Website"
          showOptionalHint
          type="url"
          placeholder="https://"
          defaultValue={state.values['websiteUrl'] ?? ''}
          error={state.fieldErrors['websiteUrl']?.[0]}
        />

        <Field
          id="contactName"
          name="contactName"
          label="Primary contact name"
          required
          autoComplete="name"
          defaultValue={state.values['contactName'] ?? ''}
          error={state.fieldErrors['contactName']?.[0]}
        />

        <MobileVerify
          initialPhone={state.values['contactPhone'] ?? ''}
          error={state.fieldErrors['contactPhone']?.[0]}
          onChange={({ phone: nextPhone, verified }) => {
            setPhone(nextPhone);
            setPhoneVerified(verified);
          }}
        />

        {state.status === 'error' && (
          <p
            role="alert"
            style={{
              fontSize: 'var(--fs-14)',
              color: 'var(--input-error-text)',
              fontWeight: 'var(--fw-600)',
            }}
          >
            {state.message}
          </p>
        )}

        <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', flexWrap: 'wrap' }}>
          <Button type="submit" disabled={pending || !phoneVerified} size="lg">
            {pending ? 'Submitting…' : 'Submit application'}
          </Button>
          <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', maxWidth: '480px' }}>
            {phoneVerified
              ? "By submitting you agree to NID's recruiter participation guidelines. You'll get a tracking ticket by email and SMS."
              : 'Verify your phone number above to enable submission.'}
          </p>
        </div>
      </form>

      {state.status === 'submitted' && state.ticket && (
        <TicketOverlay
          open={overlayOpen}
          ticket={state.ticket}
          onClose={() => setOverlayOpen(false)}
        />
      )}
    </>
  );
}
