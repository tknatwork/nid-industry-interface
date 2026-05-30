'use client';

import { useActionState, useEffect, useId, useState } from 'react';
import { Button, Field } from '@nid/ui';
import { MobileVerify } from '~/components/apply/MobileVerify';
import { TicketOverlay } from '~/components/apply/TicketOverlay';
import { PARENT_COMPANIES } from '~/lib/recruiter-public';
import { submitApplyAction } from './actions';
import { initialApplyState, type ApplyFormState } from './state';

/** Parent companies offered in the branch-registration picker (plan Round 3 §D). */
const PARENT_COMPANY_OPTIONS = Object.values(PARENT_COMPANIES);

type RegistrationMode = 'new' | 'branch';

const radioRowStyle = {
  display: 'flex',
  gap: 'var(--space-3)',
  alignItems: 'flex-start',
  cursor: 'pointer',
} as const;

const radioInputStyle = {
  marginTop: '0.2em',
  flexShrink: 0,
  accentColor: 'var(--accent)',
} as const;

const radioTitleStyle = {
  display: 'block',
  fontSize: 'var(--fs-14)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-strong)',
} as const;

const radioHintStyle = {
  display: 'block',
  fontSize: 'var(--fs-12)',
  color: 'var(--text-secondary)',
  lineHeight: 1.4,
  marginTop: 'var(--space-1)',
} as const;

// Mirror Field's label + input token vocabulary so the native <select> reads as
// a first-class field alongside the text inputs (Field has no select variant and
// is in a UI package this task does not touch).
const selectLabelStyle = {
  display: 'block',
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 'var(--space-2)',
} as const;

const selectRequiredMarkStyle = {
  marginLeft: 'var(--space-1)',
  color: 'var(--input-error-text)',
  fontWeight: 'var(--fw-600)',
} as const;

const selectStyle = {
  width: '100%',
  minHeight: 'var(--input-min-height)',
  padding: 'var(--input-padding-y) var(--input-padding-x)',
  fontSize: 'var(--input-font-size)',
  fontFamily: 'var(--ff-sans)',
  fontWeight: 'var(--fw-400)',
  color: 'var(--input-fg)',
  backgroundColor: 'var(--input-bg)',
  border: '1px solid var(--input-border)',
  borderRadius: 'var(--input-radius)',
  outline: 'none',
} as const;

const selectHelpStyle = {
  marginTop: 'var(--space-1)',
  fontSize: 'var(--fs-12)',
  color: 'var(--text-secondary)',
  lineHeight: 1.4,
} as const;

export function ApplyForm() {
  const [state, formAction, pending] = useActionState<ApplyFormState, FormData>(
    submitApplyAction,
    initialApplyState,
  );

  // Phone + verification live in client state (driven by MobileVerify) and are
  // mirrored into hidden inputs so the server action receives them.
  const [phone, setPhone] = useState(state.values['contactPhone'] ?? '');
  const [phoneVerified, setPhoneVerified] = useState(false);

  // Multi-branch grouping (plan Round 3 §D). The applicant either registers a
  // brand-new company (default) or declares this is another branch of a company
  // already registered with NID. Branch mode reveals a parent picker + a branch
  // label; both are mirrored into hidden inputs for the action. Each branch
  // still fills its OWN GST/registration/contact in the required fields above.
  const [registrationMode, setRegistrationMode] = useState<RegistrationMode>(
    state.values['registrationMode'] === 'branch' ? 'branch' : 'new',
  );
  const [parentCompanyId, setParentCompanyId] = useState(state.values['parentCompanyId'] ?? '');
  const [branchLabel, setBranchLabel] = useState(state.values['branchLabel'] ?? '');
  const branchFieldsetId = useId();
  const isBranch = registrationMode === 'branch';

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
        {/* Multi-branch grouping (plan §D), mirrored from the section below. The
            action only attaches parent/branch when mode === 'branch' + a valid pick. */}
        <input type="hidden" name="registrationMode" value={registrationMode} />
        <input type="hidden" name="parentCompanyId" value={isBranch ? parentCompanyId : ''} />
        <input type="hidden" name="branchLabel" value={isBranch ? branchLabel : ''} />

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

        {/* ── Multi-branch registration (plan Round 3 §D) ───────────────────
            Optional. Default is a brand-new company (no parent). Choosing the
            branch option groups this application under an existing parent
            company; the branch still fills its OWN GST / registration / contact
            in the required fields above. */}
        <fieldset
          style={{
            display: 'grid',
            gap: 'var(--space-3)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-3)',
            padding: 'var(--space-4)',
            margin: 0,
          }}
        >
          <legend
            style={{
              fontSize: 'var(--fs-14)',
              fontWeight: 'var(--fw-600)',
              color: 'var(--text-strong)',
              padding: '0 var(--space-2)',
            }}
          >
            Already registered with NID from another branch?
          </legend>

          <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
            One company can recruit from several branches. Each branch is its own
            account with its own GST, registration number, and contacts — we just
            group them under the parent company.
          </p>

          <label style={radioRowStyle}>
            <input
              type="radio"
              name="registrationModeChoice"
              value="new"
              checked={!isBranch}
              onChange={() => setRegistrationMode('new')}
              style={radioInputStyle}
            />
            <span>
              <span style={radioTitleStyle}>Register as a new company</span>
              <span style={radioHintStyle}>This is the first time this organisation applies to NID.</span>
            </span>
          </label>

          <label style={radioRowStyle}>
            <input
              type="radio"
              name="registrationModeChoice"
              value="branch"
              checked={isBranch}
              onChange={() => setRegistrationMode('branch')}
              aria-controls={branchFieldsetId}
              aria-expanded={isBranch}
              style={radioInputStyle}
            />
            <span>
              <span style={radioTitleStyle}>This is another branch of a company already registered with NID</span>
              <span style={radioHintStyle}>
                Pick the parent company and name this branch (e.g. Bengaluru, R&amp;D).
              </span>
            </span>
          </label>

          {isBranch && (
            <div
              id={branchFieldsetId}
              style={{
                display: 'grid',
                gap: 'var(--space-4)',
                padding: 'var(--space-4)',
                backgroundColor: 'var(--surface-panel)',
                borderRadius: 'var(--radius-3)',
                border: '1px solid var(--border-default)',
              }}
            >
              <div style={{ display: 'block' }}>
                <label htmlFor="parentCompanySelect" style={selectLabelStyle}>
                  Parent company
                  <span aria-hidden="true" style={selectRequiredMarkStyle}>
                    *
                  </span>
                </label>
                <select
                  id="parentCompanySelect"
                  value={parentCompanyId}
                  onChange={(e) => setParentCompanyId(e.target.value)}
                  required={isBranch}
                  aria-required={isBranch || undefined}
                  style={selectStyle}
                >
                  <option value="">Select the parent company…</option>
                  {PARENT_COMPANY_OPTIONS.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
                <p id="parentCompanySelect-help" style={selectHelpStyle}>
                  Don&apos;t see your company? Choose &ldquo;Register as a new company&rdquo; above instead.
                </p>
              </div>

              <Field
                id="branchLabel"
                label="Branch label"
                required={isBranch}
                placeholder="e.g. Bengaluru, R&D, North Zone"
                value={branchLabel}
                onChange={(e) => setBranchLabel(e.target.value)}
                help="How this branch is told apart from the others under the same parent."
              />
            </div>
          )}
        </fieldset>

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
