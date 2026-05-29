import type { Metadata } from 'next';
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

  return (
    <PageShell>
      <div data-discipline={d.theme}>
        <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--layout-section-y)' }}>
          <div style={{ maxWidth: '820px', margin: '0 auto' }}>
            <a href="/disciplines" style={back}>← All disciplines</a>
            <p style={kicker}>{d.programme}</p>
            <h1 style={h1}>{d.name}</h1>
            <p style={lede}>{d.summary}</p>

            <h2 style={h2}>What graduates do</h2>
            <ul style={{ margin: 'var(--space-3) 0 0', paddingLeft: 'var(--space-5)', fontSize: 'var(--fs-16)', lineHeight: 'var(--lh-30)', color: 'var(--text-primary)' }}>
              {d.whatTheyDo.map((w) => <li key={w}>{w}</li>)}
            </ul>

            <h2 style={h2}>Sample work</h2>
            <p style={{ fontSize: 'var(--fs-16)', color: 'var(--text-primary)', marginTop: 'var(--space-2)' }}>{d.sampleWork}</p>

            <div style={{ marginTop: 'var(--space-8)', padding: 'var(--card-padding)', backgroundColor: 'var(--surface-panel)', borderRadius: 'var(--card-radius)' }}>
              <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-primary)' }}>
                Hiring for this discipline? <a href="/recruiters/calculator" style={{ color: 'var(--accent)', fontWeight: 'var(--fw-600)' }}>Check the stipend floor</a> then{' '}
                <a href="/apply" style={{ color: 'var(--accent)', fontWeight: 'var(--fw-600)' }}>apply to recruit</a>.
              </p>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}

const back = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', textDecoration: 'none', display: 'inline-block', marginBottom: 'var(--space-4)' };
const kicker = { fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-600)', color: 'var(--accent)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 'var(--space-2)' };
const h1 = { fontSize: 'var(--fs-48)', lineHeight: 'var(--lh-56)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginBottom: 'var(--space-4)' };
const h2 = { fontSize: 'var(--fs-24)', lineHeight: 'var(--lh-28)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginTop: 'var(--space-8)' };
const lede = { fontSize: 'var(--fs-18)', lineHeight: 'var(--lh-30)', fontWeight: 'var(--fw-300)', color: 'var(--text-primary)' };
