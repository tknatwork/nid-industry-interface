import type { Metadata } from 'next';
import { PageShell } from '@nid/ui';
import { DISCIPLINES } from '~/lib/public-content';

export const metadata: Metadata = {
  title: 'Disciplines · NID Industry Interface',
  description: 'What NID design graduates across ~20 disciplines actually produce.',
};

export default function DisciplinesPage() {
  return (
    <PageShell>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--layout-section-y)' }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
          <p style={kicker}>The institution translates recruiter vocabulary into disciplines</p>
          <h1 style={h1}>Disciplines at NID</h1>
          <p style={lede}>
            Recruiters don&rsquo;t always know what a &ldquo;Furniture &amp; Interior&rdquo; graduate produces differently
            from a &ldquo;Communication Design&rdquo; one. This catalog is the public face of NID&rsquo;s internal taxonomy —
            the institution maps your role to the disciplines whose graduates actually fit.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-4)', marginTop: 'var(--space-8)' }}>
            {DISCIPLINES.map((d) => (
              <a key={d.slug} href={`/disciplines/${d.slug}`} data-discipline={d.theme} style={card}>
                <p style={accentKicker}>{d.programme}</p>
                <h2 style={cardTitle}>{d.name}</h2>
                <p style={cardBody}>{d.summary}</p>
                <span style={{ ...accentKicker, marginTop: 'var(--space-3)', display: 'inline-block' }}>What graduates do →</span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}

const kicker = { fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-600)', color: 'var(--accent)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 'var(--space-2)' };
const h1 = { fontSize: 'var(--fs-48)', lineHeight: 'var(--lh-56)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginBottom: 'var(--space-4)' };
const lede = { fontSize: 'var(--fs-18)', lineHeight: 'var(--lh-30)', fontWeight: 'var(--fw-300)', color: 'var(--text-primary)', maxWidth: '680px' };
const card = { display: 'block', backgroundColor: 'var(--card-bg)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)', boxShadow: 'var(--card-shadow)', borderTop: '3px solid var(--accent)', textDecoration: 'none' } as const;
const accentKicker = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--accent)', textTransform: 'uppercase' as const, letterSpacing: '0.06em' };
const cardTitle = { fontSize: 'var(--fs-18)', lineHeight: 'var(--lh-23)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)', marginTop: 'var(--space-1)' };
const cardBody = { fontSize: 'var(--fs-14)', lineHeight: 'var(--lh-18)', fontWeight: 'var(--fw-300)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' };
