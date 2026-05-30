import type { Metadata } from 'next';
import { PageShell, Button } from '@nid/ui';
import { PROCESS_STEPS, GUIDELINES } from '~/lib/recruiter-public';

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

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

          <section aria-labelledby="guidelines-at-a-glance" style={glanceWrap}>
            <div style={glanceHeader}>
              <p style={glanceKicker}>Guidelines of Sponsorship — at a glance</p>
              <h2 id="guidelines-at-a-glance" style={glanceTitle}>The terms you agree to, in six points</h2>
              <p style={glanceMeta}>
                <span style={extractBadge} aria-hidden="true">Auto-extracted</span>
                Pulled from the placement cell’s uploaded Guidelines of Sponsorship PDF — searchable here so you can scan
                the essentials before reading the full document.
              </p>
            </div>

            <ul style={glanceGrid}>
              {GUIDELINES.map((g, i) => (
                <li key={g.heading} style={glanceCard}>
                  <span style={glanceIndex} aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                  <h3 style={glanceCardTitle}>{g.heading}</h3>
                  <p style={glanceCardBody}>{g.body}</p>
                  <a href={`/recruiters/guidelines#${slugify(g.heading)}`} style={glanceCardLink}>
                    Read in full →
                  </a>
                </li>
              ))}
            </ul>

            <div style={glanceCta}>
              <a href="/recruiters/guidelines" style={{ textDecoration: 'none' }}>
                <Button variant="secondary">Guidelines of Sponsorship</Button>
              </a>
              <span style={glanceCtaNote}>The full, section-by-section document. Every recruiter accepts these on joining a cycle.</span>
            </div>
          </section>
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

const glanceWrap = { marginTop: 'var(--space-16)', paddingTop: 'var(--space-12)', borderTop: '1px solid var(--border-default)' } as const;
const glanceHeader = { maxWidth: '680px' } as const;
const glanceKicker = { fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-600)', color: 'var(--accent)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 'var(--space-2)' };
const glanceTitle = { fontSize: 'var(--fs-24)', lineHeight: 'var(--lh-28)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginBottom: 'var(--space-3)' };
const glanceMeta = { fontSize: 'var(--fs-16)', lineHeight: 'var(--lh-23)', fontWeight: 'var(--fw-300)', color: 'var(--text-secondary)' };
const extractBadge = {
  display: 'inline-block',
  marginRight: 'var(--space-2)',
  padding: 'calc(var(--space-2) / 2) var(--space-2)',
  borderRadius: 'var(--radius-pill)',
  border: '1px solid var(--border-default)',
  backgroundColor: 'var(--surface-card)',
  color: 'var(--accent)',
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  verticalAlign: 'middle',
} as const;
const glanceGrid = {
  listStyle: 'none',
  margin: 'var(--space-8) 0 0',
  padding: 0,
  display: 'grid',
  gap: 'var(--space-4)',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
} as const;
const glanceCard = {
  display: 'flex',
  flexDirection: 'column' as const,
  backgroundColor: 'var(--card-bg)',
  borderRadius: 'var(--card-radius)',
  padding: 'var(--card-padding)',
  boxShadow: 'var(--card-shadow)',
} as const;
const glanceIndex = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--accent)', letterSpacing: '0.08em', marginBottom: 'var(--space-2)' } as const;
const glanceCardTitle = { fontSize: 'var(--fs-18)', lineHeight: 'var(--lh-28)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' };
const glanceCardBody = { fontSize: 'var(--fs-14)', lineHeight: 'var(--lh-23)', fontWeight: 'var(--fw-300)', color: 'var(--text-primary)', marginTop: 'var(--space-2)' };
const glanceCardLink = { marginTop: 'var(--space-3)', fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--accent)', textTransform: 'uppercase' as const, letterSpacing: '0.06em', textDecoration: 'none' } as const;
const glanceCta = { marginTop: 'var(--space-8)', display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' as const } as const;
const glanceCtaNote = { fontSize: 'var(--fs-14)', lineHeight: 'var(--lh-23)', fontWeight: 'var(--fw-300)', color: 'var(--text-secondary)', maxWidth: '420px' } as const;
