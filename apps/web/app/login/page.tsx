import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PageShell } from '@nid/ui';
import { hasRecruiterSession } from '~/lib/recruiter-session';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = {
  title: 'Recruiter login · NID Industry Interface',
  description:
    'Sign in to the National Institute of Design Industry Interface recruiter portal. Credentials are issued by NID after your participation is approved.',
  // Login isn't useful in search results and the demo prefills credentials.
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  // A recruiter who already has a session has no reason to see the login form —
  // send them straight into the portal (plan §I).
  if (await hasRecruiterSession()) {
    redirect('/recruiter/dashboard');
  }

  return (
    <PageShell activeNav="login">
      <section
        style={{
          paddingInline: 'var(--layout-page-x)',
          paddingBlock: 'var(--layout-section-y)',
        }}
      >
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <p style={eyebrowStyle}>Recruiter portal</p>
          <h1 style={h1Style}>Sign in</h1>
          <p style={leadStyle}>
            Log in with the credentials NID emailed you after approving your participation. New here?{' '}
            <a href="/apply" style={{ color: 'var(--accent)' }}>
              Apply to recruit
            </a>{' '}
            — credentials are issued once your application clears.
          </p>

          <div style={cardStyle}>
            <LoginForm />
          </div>
        </div>
      </section>
    </PageShell>
  );
}

const eyebrowStyle = {
  fontSize: 'var(--fs-14)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--accent)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  marginBottom: 'var(--space-3)',
};

const h1Style = {
  fontSize: 'var(--fs-40)',
  lineHeight: 'var(--lh-48)',
  fontWeight: 'var(--fw-500)',
  color: 'var(--text-strong)',
  marginBottom: 'var(--space-4)',
};

const leadStyle = {
  fontSize: 'var(--fs-18)',
  lineHeight: 'var(--lh-30)',
  fontWeight: 'var(--fw-300)',
  color: 'var(--text-primary)',
  marginBottom: 'var(--space-10)',
};

const cardStyle = {
  backgroundColor: 'var(--surface-card)',
  borderRadius: 'var(--card-radius)',
  padding: 'var(--card-padding-loose)',
  boxShadow: 'var(--card-shadow)',
  border: '1px solid var(--card-border)',
};
