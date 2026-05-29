import type { Metadata } from 'next';
import { PageShell } from '@nid/ui';
import { PLACEMENT_HEADS } from '~/lib/recruiter-public';

export const metadata: Metadata = {
  title: 'Placement heads · NID Industry Interface',
  description: 'The placement head for each NID campus — name, email, and remit.',
};

export default function PlacementHeadsPage() {
  return (
    <PageShell activeNav="contact">
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--layout-section-y)' }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
          <p style={kicker}>Contact</p>
          <h1 style={h1}>Placement heads</h1>
          <p style={lede}>
            One faculty placement head leads recruitment at each campus. The role rotates on a multi-year cadence, so
            the current holder may change between cycles.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)', marginTop: 'var(--space-8)' }}>
            {PLACEMENT_HEADS.map((h) => (
              <div key={h.campus} style={card}>
                <p style={accentKicker}>{h.campus}</p>
                <h2 style={cardTitle}>{h.name}</h2>
                <a href={`mailto:${h.email}`} style={emailLink}>{h.email}</a>
                <p style={bio}>{h.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}

const kicker = { fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-600)', color: 'var(--accent)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 'var(--space-2)' };
const h1 = { fontSize: 'var(--fs-48)', lineHeight: 'var(--lh-56)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginBottom: 'var(--space-4)' };
const lede = { fontSize: 'var(--fs-18)', lineHeight: 'var(--lh-30)', fontWeight: 'var(--fw-300)', color: 'var(--text-primary)', maxWidth: '720px' };
const card = { backgroundColor: 'var(--card-bg)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)', boxShadow: 'var(--card-shadow)', borderTop: '3px solid var(--accent)' } as const;
const accentKicker = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--accent)', textTransform: 'uppercase' as const, letterSpacing: '0.06em' };
const cardTitle = { fontSize: 'var(--fs-20)', lineHeight: 'var(--lh-28)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginTop: 'var(--space-1)' };
const emailLink = { display: 'inline-block', fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-600)', color: 'var(--accent)', textDecoration: 'none', marginTop: 'var(--space-2)' };
const bio = { fontSize: 'var(--fs-14)', lineHeight: 'var(--lh-23)', fontWeight: 'var(--fw-300)', color: 'var(--text-secondary)', marginTop: 'var(--space-3)' };
