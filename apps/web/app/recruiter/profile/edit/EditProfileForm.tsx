'use client';

import { useState } from 'react';
import { Button, Field } from '@nid/ui';
import { MobileVerify } from '~/components/apply/MobileVerify';
import { updateProfileAction } from './actions';

/**
 * §L — recruiter edit of the editable contact fields (corporate email + primary
 * phone). Identity fields (company name, GST, registration number) are
 * immutable and not shown here.
 *
 * Re-verification rule: the saved number is already verified, so editing is
 * frictionless until the recruiter actually changes it. The moment the typed
 * number differs from {@link initialPhone}, MobileVerify resets to unverified
 * and Save soft-gates (mirrors the apply form's submit gate) until the new
 * number is re-verified with the demo OTP. An unchanged number keeps its
 * verified standing and skips OTP entirely.
 *
 * Phone + verification live in client state (driven by MobileVerify) and are
 * mirrored into hidden inputs so the server action receives them.
 */

export interface EditProfileFormProps {
  readonly corporateEmail: string;
  readonly contactPhone: string;
  readonly phoneVerified: boolean;
}

export function EditProfileForm({ corporateEmail, contactPhone, phoneVerified }: EditProfileFormProps) {
  const [phone, setPhone] = useState(contactPhone);
  // Has the recruiter just verified the *current* number via OTP this session?
  const [reverified, setReverified] = useState(false);

  // Did the number change from what's on file? An unchanged number needs no OTP.
  const phoneChanged = phone.trim() !== contactPhone.trim();

  // The flag we persist + gate on: a changed number must be freshly verified;
  // an unchanged one keeps its saved verified standing.
  const effectiveVerified = phoneChanged ? reverified : phoneVerified;

  return (
    <form
      action={updateProfileAction}
      noValidate
      style={{ display: 'grid', gap: 'var(--space-5)' }}
    >
      {/* Mirrored from MobileVerify so the action gets the phone + verified flag. */}
      <input type="hidden" name="contactPhone" value={phone} />
      <input type="hidden" name="phoneVerified" value={effectiveVerified ? 'true' : 'false'} />

      <Field
        id="corporateEmail"
        name="corporateEmail"
        label="Corporate email"
        type="email"
        required
        autoComplete="email"
        help="Use your company domain. Personal addresses (Gmail, Yahoo, Outlook) are not accepted."
        defaultValue={corporateEmail}
      />

      <MobileVerify
        initialPhone={contactPhone}
        onChange={({ phone: nextPhone, verified }) => {
          setPhone(nextPhone);
          setReverified(verified);
        }}
      />

      <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', flexWrap: 'wrap' }}>
        <Button type="submit" disabled={!effectiveVerified} size="lg">
          Save changes
        </Button>
        <a
          href="/recruiter/profile"
          style={{ fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textDecoration: 'none' }}
        >
          Cancel
        </a>
        <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', maxWidth: '480px' }}>
          {effectiveVerified
            ? phoneChanged
              ? 'New number verified — save to update your contact details.'
              : 'Your number is unchanged and stays verified. Edit your email and save.'
            : 'Re-verify your new phone number above to enable saving.'}
        </p>
      </div>
    </form>
  );
}
