import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import { RecruiterShell } from '@nid/ui';
import { getCompanyRecord } from '@nid/module-recruiter-onboarding';
import { RecruiterAccountMenu } from '~/components/RecruiterAccountMenu';
import { readRecruiterSession } from '~/lib/recruiter-session';
import { EditProfileForm } from './EditProfileForm';

export const metadata: Metadata = {
  title: 'Edit contact details · Recruiter · NID Industry Interface',
  robots: { index: false, follow: false },
};

/**
 * §L — the one writable slice of "Your setup": a recruiter editing the contact
 * fields the placement cell lets them self-serve (corporate email + primary
 * phone). Identity fields (company name, GST, registration number) stay
 * immutable and live read-only on the parent profile page. Reads the record via
 * the same `getCompanyRecord` lookup the profile uses, then hands the editable
 * values to the client form (which owns the re-verification soft-gate).
 */
export default async function EditRecruiterProfilePage() {
  const { recruiterId, companyName } = await readRecruiterSession();
  const record = getCompanyRecord(recruiterId);

  return (
    <RecruiterShell companyName={companyName} accountMenu={<RecruiterAccountMenu companyName={companyName} />}>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <header style={{ marginBottom: 'var(--space-8)' }}>
            <p style={kicker}>
              <a href="/recruiter/profile" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                ← Your setup
              </a>
            </p>
            <h1 style={pageTitle}>Edit contact details</h1>
            <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)', lineHeight: 1.55 }}>
              Update the corporate email and primary phone the placement cell uses to reach{' '}
              <strong style={{ color: 'var(--text-strong)' }}>{companyName}</strong>. Company name, GST, and registration
              number are fixed once verified — contact the placement cell to change those.
            </p>
          </header>

          <div
            style={{
              backgroundColor: 'var(--surface-card)',
              border: '1px solid var(--card-border)',
              borderRadius: 'var(--card-radius)',
              padding: 'var(--card-padding)',
            }}
          >
            <EditProfileForm
              corporateEmail={record?.corporateEmail ?? ''}
              contactPhone={record?.contactPhone ?? ''}
              phoneVerified={record?.phoneVerified ?? false}
            />
          </div>
        </div>
      </section>
    </RecruiterShell>
  );
}

const kicker: CSSProperties = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 'var(--space-2)',
};

const pageTitle: CSSProperties = {
  fontSize: 'var(--fs-40)',
  lineHeight: 'var(--lh-48)',
  fontWeight: 'var(--fw-500)',
  color: 'var(--text-strong)',
};
