import type { Metadata } from 'next';
import { PageShell } from '@nid/ui';
import { ApplyForm } from './ApplyForm';

export const metadata: Metadata = {
  title: 'Apply to recruit · NID Industry Interface',
  description:
    'Apply to recruit from the National Institute of Design. No login required — receive a token and track your application through every step.',
};

export default function ApplyPage() {
  return (
    <PageShell activeNav="apply">
      <section
        style={{
          paddingInline: 'var(--layout-page-x)',
          paddingBlock: 'var(--layout-section-y)',
        }}
      >
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <p
            style={{
              fontSize: 'var(--fs-14)',
              fontWeight: 'var(--fw-600)',
              color: 'var(--accent)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 'var(--space-3)',
            }}
          >
            Spring 2026 cycle is open
          </p>
          <h1
            style={{
              fontSize: 'var(--fs-40)',
              lineHeight: 'var(--lh-48)',
              fontWeight: 'var(--fw-500)',
              color: 'var(--text-strong)',
              marginBottom: 'var(--space-4)',
            }}
          >
            Apply to recruit from NID
          </h1>
          <p
            style={{
              fontSize: 'var(--fs-18)',
              lineHeight: 'var(--lh-30)',
              fontWeight: 'var(--fw-300)',
              color: 'var(--text-primary)',
              maxWidth: '720px',
              marginBottom: 'var(--space-10)',
            }}
          >
            We&rsquo;ll verify your company details, share a participation invoice, and issue login
            credentials once payment is received. You will get a token to follow every step of the
            process at <code style={{ fontFamily: 'inherit' }}>/track/&lt;your-token&gt;</code>.
          </p>

          <div
            style={{
              backgroundColor: 'var(--surface-card)',
              borderRadius: 'var(--card-radius)',
              padding: 'var(--card-padding-loose)',
              boxShadow: 'var(--card-shadow)',
              border: '1px solid var(--card-border)',
            }}
          >
            <ApplyForm />
          </div>

          <p
            style={{
              fontSize: 'var(--fs-12)',
              color: 'var(--text-secondary)',
              marginTop: 'var(--space-8)',
              lineHeight: 1.6,
            }}
          >
            Already applied? Track your application at{' '}
            <a href="/track" style={{ color: 'var(--accent)' }}>
              /track
            </a>{' '}
            using the token we emailed you.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
