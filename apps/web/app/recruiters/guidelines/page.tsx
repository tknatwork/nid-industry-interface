import type { Metadata } from 'next';
import { PageShell } from '@nid/ui';
import { GUIDELINES } from '~/lib/recruiter-public';

export const metadata: Metadata = {
  title: 'Sponsorship guidelines · NID Industry Interface',
  description: 'Eligibility, fees, JD structure, conduct, IPR, and redressal — the rules every recruiter agrees to.',
};

export default function GuidelinesPage() {
  return (
    <PageShell>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--layout-section-y)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <a href="/recruiters" style={back}>← For recruiters</a>
          <p style={kicker}>Read first</p>
          <h1 style={h1}>Sponsorship guidelines</h1>
          <p style={lede}>
            These are the terms every recruiting organisation accepts when it joins a cycle. Jump to a section, or read
            straight through.
          </p>

          <nav aria-label="Sections" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginTop: 'var(--space-6)' }}>
            {GUIDELINES.map((g) => (
              <a key={g.heading} href={`#${slugify(g.heading)}`} style={chip}>{g.heading}</a>
            ))}
          </nav>

          <div style={{ display: 'grid', gap: 'var(--space-4)', marginTop: 'var(--space-8)' }}>
            {GUIDELINES.map((g) => (
              <article key={g.heading} id={slugify(g.heading)} style={section}>
                <h2 style={h2}>{g.heading}</h2>
                <p style={body}>{g.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const back = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', textDecoration: 'none', display: 'inline-block', marginBottom: 'var(--space-4)' };
const kicker = { fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-600)', color: 'var(--accent)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 'var(--space-2)' };
const h1 = { fontSize: 'var(--fs-48)', lineHeight: 'var(--lh-56)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginBottom: 'var(--space-4)' };
const lede = { fontSize: 'var(--fs-18)', lineHeight: 'var(--lh-30)', fontWeight: 'var(--fw-300)', color: 'var(--text-primary)', maxWidth: '680px' };
const chip = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-primary)', textTransform: 'uppercase' as const, letterSpacing: '0.06em', textDecoration: 'none', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-default)', backgroundColor: 'var(--surface-card)' } as const;
const section = { backgroundColor: 'var(--card-bg)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)', boxShadow: 'var(--card-shadow)', scrollMarginTop: 'var(--space-8)' } as const;
const h2 = { fontSize: 'var(--fs-24)', lineHeight: 'var(--lh-28)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' };
const body = { fontSize: 'var(--fs-16)', lineHeight: 'var(--lh-30)', fontWeight: 'var(--fw-300)', color: 'var(--text-primary)', marginTop: 'var(--space-3)' };
