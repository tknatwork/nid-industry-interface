import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PageShell, Button, Field } from '@nid/ui';
import { parseTicketId } from '@nid/module-recruiter-onboarding';

export const metadata: Metadata = {
  title: 'Track your application · NID Industry Interface',
  description: 'Enter your application ticket to see live status.',
};

async function lookupAction(formData: FormData) {
  'use server';
  const raw = formData.get('ticket');
  if (typeof raw !== 'string') redirect('/track?error=missing');
  const cleaned = raw.trim().toUpperCase();
  if (!parseTicketId(cleaned)) redirect('/track?error=invalid');
  redirect(`/track/${cleaned}`);
}

export default async function TrackEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const errorMessage =
    params.error === 'missing'
      ? 'Enter your ticket to continue.'
      : params.error === 'invalid'
        ? 'That ticket doesn’t look right. Format: NID-YYYY-A-NNNN.'
        : undefined;

  return (
    <PageShell activeNav="track">
      <section
        style={{
          paddingInline: 'var(--layout-page-x)',
          paddingBlock: 'var(--layout-section-y)',
        }}
      >
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
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
            Track your application
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
            Where is your application?
          </h1>
          <p
            style={{
              fontSize: 'var(--fs-18)',
              lineHeight: 'var(--lh-30)',
              fontWeight: 'var(--fw-300)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-8)',
            }}
          >
            Paste the ticket we emailed and texted you. The tracker page never expires &mdash; revisit
            any time for a history of every step.
          </p>

          <form
            action={lookupAction}
            style={{
              display: 'grid',
              gap: 'var(--space-4)',
              backgroundColor: 'var(--surface-card)',
              padding: 'var(--card-padding-loose)',
              borderRadius: 'var(--card-radius)',
              boxShadow: 'var(--card-shadow)',
              border: '1px solid var(--card-border)',
            }}
          >
            <Field
              id="ticket"
              name="ticket"
              label="Application ticket"
              placeholder="NID-2026-A-0042"
              required
              autoComplete="off"
              autoFocus
              style={{ textTransform: 'uppercase', fontFamily: 'ui-monospace, monospace' }}
              error={errorMessage}
            />
            <div>
              <Button type="submit" size="lg">
                Open tracker
              </Button>
            </div>
          </form>

          <p
            style={{
              fontSize: 'var(--fs-12)',
              color: 'var(--text-secondary)',
              marginTop: 'var(--space-8)',
              lineHeight: 1.6,
            }}
          >
            Lost your ticket? Email{' '}
            <a href="mailto:industry@nid.edu" style={{ color: 'var(--accent)' }}>
              industry@nid.edu
            </a>{' '}
            with your registered corporate email and we will resend it.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
