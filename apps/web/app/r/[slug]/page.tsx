import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageShell } from '@nid/ui';
import { MICROSITES } from '~/lib/recruiter-public';

export function generateStaticParams() {
  return Object.keys(MICROSITES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const site = MICROSITES[slug];
  return { title: site ? `${site.companyName} · NID Industry Interface` : 'Company · NID Industry Interface' };
}

export default async function MicrositePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = MICROSITES[slug];
  if (!site) notFound();

  return (
    <PageShell>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--layout-section-y)' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          <p style={kicker}>Recruiter on NID Industry Interface</p>
          <h1 style={h1}>{site.companyName}</h1>
          <p style={lede}>Recruiting NID design graduates since {site.since}.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginTop: 'var(--space-8)' }}>
            <div style={stat}>
              <p style={statLabel}>Member since</p>
              <p style={statValue}>{site.since}</p>
            </div>
            <div style={stat}>
              <p style={statLabel}>Recruiter ID</p>
              <p style={statValue}>{site.recruiterId}</p>
            </div>
          </div>

          <h2 style={h2}>Sectors</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
            {site.sectors.map((s) => (
              <span key={s} style={chip}>{s}</span>
            ))}
          </div>

          <div style={{ marginTop: 'var(--space-12)', padding: 'var(--card-padding)', backgroundColor: 'var(--surface-panel)', borderRadius: 'var(--card-radius)' }}>
            <h2 style={{ ...h2, marginTop: 0 }}>Accountability</h2>
            <p style={{ fontSize: 'var(--fs-16)', lineHeight: 'var(--lh-30)', color: 'var(--text-primary)', marginTop: 'var(--space-2)' }}>
              NID publishes anonymised, aggregate redressal statistics for every recruiter — part of holding the
              hiring process accountable in both directions.
            </p>
            <a href={`/r/${slug}/transparency`} style={{ display: 'inline-block', marginTop: 'var(--space-3)', fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-600)', color: 'var(--accent)', textDecoration: 'none' }}>
              View the transparency report →
            </a>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

const kicker = { fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-600)', color: 'var(--accent)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 'var(--space-2)' };
const h1 = { fontSize: 'var(--fs-48)', lineHeight: 'var(--lh-56)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginBottom: 'var(--space-4)' };
const h2 = { fontSize: 'var(--fs-24)', lineHeight: 'var(--lh-28)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginTop: 'var(--space-10)' };
const lede = { fontSize: 'var(--fs-18)', lineHeight: 'var(--lh-30)', fontWeight: 'var(--fw-300)', color: 'var(--text-primary)' };
const stat = { backgroundColor: 'var(--card-bg)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)', boxShadow: 'var(--card-shadow)' } as const;
const statLabel = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.06em' };
const statValue = { fontSize: 'var(--fs-24)', lineHeight: 'var(--lh-28)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginTop: 'var(--space-1)' };
const chip = { fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-500)', color: 'var(--text-primary)', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-default)', backgroundColor: 'var(--surface-card)' } as const;
