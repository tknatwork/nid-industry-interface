import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageShell } from '@nid/ui';
import { transparencyFor } from '@nid/module-admin-accountability';
import { MICROSITES } from '~/lib/recruiter-public';

export function generateStaticParams() {
  return Object.keys(MICROSITES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const site = MICROSITES[slug];
  return { title: site ? `Transparency — ${site.companyName} · NID Industry Interface` : 'Transparency · NID Industry Interface' };
}

export default async function TransparencyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = MICROSITES[slug];
  if (!site) notFound();

  const stats = transparencyFor(site.companyName);
  const categories = Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1]);

  return (
    <PageShell>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--layout-section-y)' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          <a href={`/r/${slug}`} style={back}>← {site.companyName}</a>
          <p style={kicker}>Redressal transparency</p>
          <h1 style={h1}>{site.companyName}</h1>
          <p style={lede}>
            Aggregate redressal statistics for this recruiter, covering the last five years and fully anonymised. No
            student is identifiable; counts describe the volume and outcome of complaints, not individuals.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginTop: 'var(--space-8)' }}>
            <div style={stat}>
              <p style={statLabel}>Total cases</p>
              <p style={statValue}>{stats.total}</p>
            </div>
            <div style={stat}>
              <p style={statLabel}>Upheld</p>
              <p style={statValue}>{stats.upheld}</p>
            </div>
          </div>

          <h2 style={h2}>By category</h2>
          {categories.length === 0 ? (
            <p style={{ fontSize: 'var(--fs-16)', lineHeight: 'var(--lh-30)', color: 'var(--text-secondary)', marginTop: 'var(--space-3)' }}>
              No redressal cases have been recorded for this recruiter in the last five years.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 'var(--space-4) 0 0', padding: 0, display: 'grid', gap: 'var(--space-2)' }}>
              {categories.map(([category, count]) => (
                <li key={category} style={catRow}>
                  <span style={catName}>{category}</span>
                  <span style={catCount}>{count}</span>
                </li>
              ))}
            </ul>
          )}

          <p style={footnote}>
            Anonymised, aggregated over the last 5 years. An upheld case adjusts the recruiter&rsquo;s health score and,
            in serious cases, can lead to revocation of portal access.
          </p>
        </div>
      </section>
    </PageShell>
  );
}

const back = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', textDecoration: 'none', display: 'inline-block', marginBottom: 'var(--space-4)' };
const kicker = { fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-600)', color: 'var(--accent)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 'var(--space-2)' };
const h1 = { fontSize: 'var(--fs-48)', lineHeight: 'var(--lh-56)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginBottom: 'var(--space-4)' };
const h2 = { fontSize: 'var(--fs-24)', lineHeight: 'var(--lh-28)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginTop: 'var(--space-10)' };
const lede = { fontSize: 'var(--fs-18)', lineHeight: 'var(--lh-30)', fontWeight: 'var(--fw-300)', color: 'var(--text-primary)', maxWidth: '680px' };
const stat = { backgroundColor: 'var(--card-bg)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)', boxShadow: 'var(--card-shadow)' } as const;
const statLabel = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.06em' };
const statValue = { fontSize: 'var(--fs-40)', lineHeight: 'var(--lh-48)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginTop: 'var(--space-1)' };
const catRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)', backgroundColor: 'var(--surface-panel)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-3)', padding: 'var(--space-3) var(--space-4)' } as const;
const catName = { fontSize: 'var(--fs-16)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', textTransform: 'capitalize' as const };
const catCount = { fontSize: 'var(--fs-18)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)' };
const footnote = { fontSize: 'var(--fs-14)', lineHeight: 'var(--lh-23)', color: 'var(--text-secondary)', marginTop: 'var(--space-8)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-default)' };
