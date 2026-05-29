import type { Metadata } from 'next';
import { PageShell } from '@nid/ui';
import { CAMPUSES, BACHELOR_CAMPUSES } from '~/lib/public-content';

export const metadata: Metadata = {
  title: 'Campuses · NID Industry Interface',
  description: 'The 3 legacy DPIIT campuses served by this portal.',
};

export default function CampusesPage() {
  return (
    <PageShell>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--layout-section-y)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <p style={kicker}>This portal serves the 3 legacy DPIIT campuses</p>
          <h1 style={h1}>Campuses</h1>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-4)', marginTop: 'var(--space-6)' }}>
            {CAMPUSES.map((c) => (
              <a key={c.slug} href={`/campuses/${c.slug}`} style={card}>
                <h2 style={cardTitle}>{c.name}</h2>
                <p style={accentKicker}>{c.programmes}</p>
                <p style={cardBody}>{c.blurb}</p>
              </a>
            ))}
          </div>

          <div style={{ marginTop: 'var(--space-10)', padding: 'var(--card-padding)', backgroundColor: 'var(--surface-panel)', borderRadius: 'var(--card-radius)' }}>
            <h2 style={{ ...cardTitle, marginBottom: 'var(--space-2)' }}>The 4 bachelor-only campuses</h2>
            <p style={{ ...cardBody, marginBottom: 'var(--space-3)' }}>
              These run their own Bachelors recruiter portals on top of Industry Interface APIs — they are API
              consumers, not sub-pages of this portal. This solves the &ldquo;Bachelors and Masters served the same
              packages&rdquo; problem.
            </p>
            <ul style={{ margin: 0, paddingLeft: 'var(--space-5)', fontSize: 'var(--fs-14)', color: 'var(--text-primary)' }}>
              {BACHELOR_CAMPUSES.map((b) => (
                <li key={b.name}><strong>{b.name}</strong> ({b.location}) — {b.note}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

const kicker = { fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-600)', color: 'var(--accent)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 'var(--space-2)' };
const h1 = { fontSize: 'var(--fs-48)', lineHeight: 'var(--lh-56)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' };
const card = { display: 'block', backgroundColor: 'var(--card-bg)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)', boxShadow: 'var(--card-shadow)', borderTop: '3px solid var(--accent)', textDecoration: 'none' } as const;
const accentKicker = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--accent)', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginTop: 'var(--space-1)' };
const cardTitle = { fontSize: 'var(--fs-20)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)' };
const cardBody = { fontSize: 'var(--fs-14)', lineHeight: 'var(--lh-18)', fontWeight: 'var(--fw-300)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' };
