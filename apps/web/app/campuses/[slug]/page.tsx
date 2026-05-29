import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageShell } from '@nid/ui';
import { CAMPUSES } from '~/lib/public-content';

export function generateStaticParams() {
  return CAMPUSES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = CAMPUSES.find((x) => x.slug === slug);
  return { title: c ? `${c.name} · NID Industry Interface` : 'Campus · NID' };
}

export default async function CampusDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = CAMPUSES.find((x) => x.slug === slug);
  if (!c) notFound();

  return (
    <PageShell>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--layout-section-y)' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <a href="/campuses" style={back}>← All campuses</a>
          <h1 style={h1}>{c.name}</h1>
          <p style={{ fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-600)', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 'var(--space-2)' }}>{c.programmes}</p>
          <p style={{ fontSize: 'var(--fs-18)', lineHeight: 'var(--lh-30)', fontWeight: 'var(--fw-300)', color: 'var(--text-primary)', marginTop: 'var(--space-4)' }}>{c.blurb}</p>
          <div style={{ marginTop: 'var(--space-8)', display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-600)' }}>
            <a href="/disciplines" style={link}>Disciplines here →</a>
            <a href="/contact/placement-heads" style={link}>Placement head →</a>
            <a href="/cycles" style={link}>Cycles →</a>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

const back = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', textDecoration: 'none', display: 'inline-block', marginBottom: 'var(--space-4)' };
const h1 = { fontSize: 'var(--fs-48)', lineHeight: 'var(--lh-56)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' };
const link = { color: 'var(--accent)', textDecoration: 'none' } as const;
