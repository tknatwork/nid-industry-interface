import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import { notFound } from 'next/navigation';
import { PageShell } from '@nid/ui';
import { disciplineBySlug, DISCIPLINES } from '~/lib/public-content';

export function generateStaticParams() {
  return DISCIPLINES.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const d = disciplineBySlug(slug);
  return { title: d ? `${d.name} · NID Industry Interface` : 'Discipline · NID' };
}

export default async function DisciplineDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = disciplineBySlug(slug);
  if (!d) notFound();

  // Deep-link companions: the prev/next disciplines, so a single-discipline
  // landing still hints at the full set of 20 without re-listing them.
  const index = DISCIPLINES.findIndex((x) => x.slug === d.slug);
  const prev = index > 0 ? DISCIPLINES[index - 1] : undefined;
  const next = index < DISCIPLINES.length - 1 ? DISCIPLINES[index + 1] : undefined;

  return (
    <PageShell activeNav="disciplines">
      <div data-discipline={d.theme}>
        <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--layout-section-y)' }}>
          <div style={{ maxWidth: '820px', margin: '0 auto' }}>
            <a href="/disciplines" style={back}>
              ← All {DISCIPLINES.length} disciplines
            </a>
            <p style={kicker}>{d.programme}</p>
            <h1 style={h1}>{d.name}</h1>
            <p style={lede}>{d.summary}</p>

            <h2 style={h2}>What graduates do</h2>
            <ul style={{ margin: 'var(--space-3) 0 0', paddingLeft: 'var(--space-5)', fontSize: 'var(--fs-16)', lineHeight: 'var(--lh-30)', color: 'var(--text-primary)' }}>
              {d.whatTheyDo.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>

            <h2 style={h2}>Sample work</h2>
            <p style={{ fontSize: 'var(--fs-16)', color: 'var(--text-primary)', marginTop: 'var(--space-2)' }}>{d.sampleWork}</p>

            {/* Tie back to the one-page brochure with the sticky 20-tab bar. */}
            <a href={`/disciplines#${d.slug}`} style={brochureLink}>
              Read this in the full brochure ↓
            </a>

            {/* Prev / next discipline — keeps the full set reachable from a deep link. */}
            <nav style={pager} aria-label="Browse disciplines">
              {prev ? (
                <a href={`/disciplines/${prev.slug}`} style={pagerLink}>
                  <span style={pagerDir}>← Previous</span>
                  <span style={pagerName}>{prev.name}</span>
                </a>
              ) : (
                <span />
              )}
              {next ? (
                <a href={`/disciplines/${next.slug}`} style={{ ...pagerLink, textAlign: 'right' }}>
                  <span style={pagerDir}>Next →</span>
                  <span style={pagerName}>{next.name}</span>
                </a>
              ) : (
                <span />
              )}
            </nav>

            <div style={{ marginTop: 'var(--space-8)', padding: 'var(--card-padding)', backgroundColor: 'var(--surface-panel)', borderRadius: 'var(--card-radius)' }}>
              <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-primary)' }}>
                Hiring for this discipline?{' '}
                <a href="/recruiters/calculator" style={{ color: 'var(--accent)', fontWeight: 'var(--fw-600)' }}>
                  Check the stipend floor
                </a>{' '}
                then{' '}
                <a href="/apply" style={{ color: 'var(--accent)', fontWeight: 'var(--fw-600)' }}>
                  apply to recruit
                </a>
                .
              </p>
            </div>

            {/* Guidelines of Sponsorship CTA. */}
            <div style={ctaCard}>
              <div>
                <p style={ctaKicker}>Before you recruit</p>
                <h2 style={ctaTitle}>Guidelines of Sponsorship</h2>
                <p style={ctaBody}>
                  Eligibility, fees, JD structure, conduct, IPR, and redressal — the rulebook every recruiter agrees to.
                </p>
              </div>
              <a href="/recruiters/guidelines" style={ctaButton}>
                Read the guidelines →
              </a>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}

const back = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  textDecoration: 'none',
  display: 'inline-block',
  marginBottom: 'var(--space-4)',
};
const kicker: CSSProperties = {
  fontSize: 'var(--fs-14)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--accent)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 'var(--space-2)',
};
const h1: CSSProperties = {
  fontSize: 'var(--fs-48)',
  lineHeight: 'var(--lh-56)',
  fontWeight: 'var(--fw-500)',
  color: 'var(--text-strong)',
  marginBottom: 'var(--space-4)',
};
const h2: CSSProperties = {
  fontSize: 'var(--fs-24)',
  lineHeight: 'var(--lh-28)',
  fontWeight: 'var(--fw-500)',
  color: 'var(--text-strong)',
  marginTop: 'var(--space-8)',
};
const lede: CSSProperties = {
  fontSize: 'var(--fs-18)',
  lineHeight: 'var(--lh-30)',
  fontWeight: 'var(--fw-300)',
  color: 'var(--text-primary)',
};

const brochureLink: CSSProperties = {
  display: 'inline-block',
  marginTop: 'var(--space-8)',
  color: 'var(--accent)',
  fontWeight: 'var(--fw-600)',
  fontSize: 'var(--fs-14)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  textDecoration: 'none',
};

const pager: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 'var(--space-4)',
  marginTop: 'var(--space-6)',
  paddingTop: 'var(--space-6)',
  borderTop: '1px solid var(--border-default)',
};
const pagerLink: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  textDecoration: 'none',
};
const pagerDir: CSSProperties = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};
const pagerName: CSSProperties = { fontSize: 'var(--fs-16)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)' };

const ctaCard: CSSProperties = {
  marginTop: 'var(--space-8)',
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--space-4)',
  padding: 'var(--card-padding)',
  backgroundColor: 'var(--surface-card)',
  border: '1px solid var(--border-default)',
  borderLeft: '4px solid var(--accent)',
  borderRadius: 'var(--radius-4)',
};
const ctaKicker: CSSProperties = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--accent)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};
const ctaTitle: CSSProperties = {
  fontSize: 'var(--fs-20)',
  lineHeight: 'var(--lh-23)',
  fontWeight: 'var(--fw-500)',
  color: 'var(--text-strong)',
  marginTop: 'var(--space-1)',
};
const ctaBody: CSSProperties = {
  fontSize: 'var(--fs-14)',
  lineHeight: 'var(--lh-23)',
  fontWeight: 'var(--fw-300)',
  color: 'var(--text-secondary)',
  marginTop: 'var(--space-2)',
  maxWidth: '520px',
};
const ctaButton: CSSProperties = {
  flex: '0 0 auto',
  backgroundColor: 'var(--accent)',
  color: 'var(--accent-text)',
  borderRadius: 'var(--radius-pill)',
  padding: 'var(--space-3) var(--space-6)',
  fontSize: 'var(--fs-14)',
  fontWeight: 'var(--fw-600)',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
};
