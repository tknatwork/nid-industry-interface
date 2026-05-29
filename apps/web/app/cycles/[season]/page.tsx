import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageShell, StatusPill, Button, type StatusTone } from '@nid/ui';
import { cycleBySlug, CYCLES, disciplineBySlug } from '~/lib/public-content';

export function generateStaticParams() {
  return CYCLES.map((c) => ({ season: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ season: string }> }): Promise<Metadata> {
  const { season } = await params;
  const c = cycleBySlug(season);
  return { title: c ? `${c.label} · NID Industry Interface` : 'Cycle · NID' };
}

export default async function CycleDetail({ params }: { params: Promise<{ season: string }> }) {
  const { season } = await params;
  const c = cycleBySlug(season);
  if (!c) notFound();

  const timeline: ReadonlyArray<[string, string]> = [
    ['Applications open', c.applyOpens],
    ['JD upload deadline', c.jdDeadline],
    ['Browse opens to recruiters', c.browseOpens],
    ['Interview window', c.interviewWindow],
    ['Offers by', c.offerBy],
  ];

  return (
    <PageShell>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--layout-section-y)' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          <a href="/cycles" style={back}>← All cycles</a>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <h1 style={h1}>{c.label}</h1>
            <StatusPill tone={tone(c.status)}>{c.status}</StatusPill>
          </div>
          <p style={{ fontSize: 'var(--fs-16)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
            Participation fee ₹{c.feeRupees.toLocaleString('en-IN')} (non-refundable) · {c.eligibleDisciplines.length} eligible disciplines
          </p>

          <h2 style={h2}>Key dates</h2>
          <div style={{ display: 'grid', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
            {timeline.map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-default)', padding: 'var(--space-2) 0' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-14)' }}>{k}</span>
                <span style={{ color: 'var(--text-strong)', fontWeight: 'var(--fw-500)', fontSize: 'var(--fs-14)' }}>{v}</span>
              </div>
            ))}
          </div>

          <h2 style={h2}>Eligible disciplines</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
            {c.eligibleDisciplines.map((slug) => {
              const d = disciplineBySlug(slug);
              return (
                <a key={slug} href={`/disciplines/${slug}`} style={chip}>{d?.name ?? slug}</a>
              );
            })}
          </div>

          {c.status === 'open' && (
            <div style={{ marginTop: 'var(--space-8)' }}>
              <a href="/apply" style={{ textDecoration: 'none' }}><Button size="lg">Apply to recruit this cycle</Button></a>
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}

function tone(s: string): StatusTone {
  return s === 'open' ? 'success' : s === 'upcoming' ? 'info' : 'neutral';
}
const back = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', textDecoration: 'none', display: 'inline-block', marginBottom: 'var(--space-4)' };
const h1 = { fontSize: 'var(--fs-48)', lineHeight: 'var(--lh-56)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' };
const h2 = { fontSize: 'var(--fs-24)', lineHeight: 'var(--lh-28)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginTop: 'var(--space-8)' };
const chip = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', backgroundColor: 'var(--surface-panel)', borderRadius: 'var(--radius-pill)', padding: 'var(--space-1) var(--space-3)', textDecoration: 'none' } as const;
