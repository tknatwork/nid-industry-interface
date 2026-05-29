import type { Metadata } from 'next';
import { PageShell, Button } from '@nid/ui';
import { PROCESS_STEPS } from '~/lib/recruiter-public';

export const metadata: Metadata = {
  title: 'Recruiter process · NID Industry Interface',
  description: 'The eight steps from applying with no login to running the offer cascade.',
};

export default function ProcessPage() {
  return (
    <PageShell activeNav="process">
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--layout-section-y)' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          <a href="/recruiters" style={back}>← For recruiters</a>
          <p style={kicker}>How it works</p>
          <h1 style={h1}>The recruiter process</h1>
          <p style={lede}>
            Eight steps, start to finish. You can do the first three with no account at all — credentials are issued
            only once the placement office has verified your organisation.
          </p>

          <ol style={{ listStyle: 'none', margin: 'var(--space-8) 0 0', padding: 0, display: 'grid', gap: 'var(--space-4)' }}>
            {PROCESS_STEPS.map((s) => (
              <li key={s.step} style={step}>
                <span style={badge}>{s.step}</span>
                <div>
                  <h2 style={stepTitle}>{s.title}</h2>
                  <p style={stepBody}>{s.detail}</p>
                </div>
              </li>
            ))}
          </ol>

          <div style={{ marginTop: 'var(--space-12)', display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <a href="/apply" style={{ textDecoration: 'none' }}><Button variant="primary">Apply to recruit</Button></a>
            <a href="/recruiters/calculator" style={{ textDecoration: 'none' }}><Button variant="secondary">Check the stipend floor</Button></a>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

const back = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', textDecoration: 'none', display: 'inline-block', marginBottom: 'var(--space-4)' };
const kicker = { fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-600)', color: 'var(--accent)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 'var(--space-2)' };
const h1 = { fontSize: 'var(--fs-48)', lineHeight: 'var(--lh-56)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginBottom: 'var(--space-4)' };
const lede = { fontSize: 'var(--fs-18)', lineHeight: 'var(--lh-30)', fontWeight: 'var(--fw-300)', color: 'var(--text-primary)', maxWidth: '680px' };
const step = { display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start', backgroundColor: 'var(--card-bg)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)', boxShadow: 'var(--card-shadow)' } as const;
const badge = { flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 'var(--space-8)', height: 'var(--space-8)', borderRadius: 'var(--radius-pill)', backgroundColor: 'var(--accent)', color: 'var(--surface-card)', fontSize: 'var(--fs-16)', fontWeight: 'var(--fw-600)' } as const;
const stepTitle = { fontSize: 'var(--fs-20)', lineHeight: 'var(--lh-28)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' };
const stepBody = { fontSize: 'var(--fs-16)', lineHeight: 'var(--lh-23)', fontWeight: 'var(--fw-300)', color: 'var(--text-primary)', marginTop: 'var(--space-2)' };
