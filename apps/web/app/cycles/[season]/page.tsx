import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageShell, StatusPill, Button, type StatusTone } from '@nid/ui';
import { cycleBySlug, CYCLES, disciplineBySlug, type DateSpan } from '~/lib/public-content';
import { AddToCalendar } from '~/components/AddToCalendar';
import { AcademicCalendarOverlay } from '~/components/AcademicCalendarOverlay';

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

  const a = c.activities;
  const span = (s: DateSpan) => (s.start === s.end ? s.start : `${s.start} – ${s.end}`);
  const timeline: ReadonlyArray<{ key: string; label: string; span: DateSpan }> = [
    { key: 'applications', label: 'Applications', span: a.applications },
    { key: 'jdDeadline', label: 'JD upload deadline', span: a.jdDeadline },
    { key: 'browsing', label: 'Browse opens to recruiters', span: a.browsing },
    { key: 'interviewWindow', label: 'Interview window', span: a.interviewWindow },
    { key: 'offers', label: 'Offers', span: a.offers },
  ];

  return (
    <PageShell activeNav="cycles">
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--layout-section-y)' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          <a href="/cycles" style={back}>← Timeline</a>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <h1 style={h1}>{c.label}</h1>
            <StatusPill tone={tone(c.status)}>{c.status}</StatusPill>
          </div>

          <h2 style={h2}>Fees</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
            <div style={feeCard}>
              <p style={feeLabel}>Participation fee</p>
              <p style={feeAmount}>₹{c.participationFeeRupees.toLocaleString('en-IN')}</p>
              <p style={feeNote}>Non-refundable. Paid once at sign-up to take part in this cycle.</p>
            </div>
            <div style={feeCard}>
              <p style={feeLabel}>Student-mentor / GP fee</p>
              <p style={feeAmount}>₹{c.gpFeePerStudentRupees.toLocaleString('en-IN')} <span style={{ fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-500)', color: 'var(--text-secondary)' }}>/ student</span></p>
              <p style={feeNote}>Invoiced to the company <em>after</em> a hired student joins and starts their Graduation Project. Not applicable to full-time hires.</p>
            </div>
          </div>
          <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
            {c.eligibleDisciplines.length} eligible disciplines this cycle.
          </p>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <h2 style={h2}>Key dates</h2>
            <div style={{ alignSelf: 'flex-end' }}><AcademicCalendarOverlay variant="ghost" /></div>
          </div>
          <div style={{ display: 'grid', gap: 'var(--space-1)', marginTop: 'var(--space-3)' }}>
            {timeline.map(({ key, label, span: s }) => (
              <div key={key} style={dateRow}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-12)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 'var(--fw-600)' }}>{label}</p>
                  <p style={{ color: 'var(--text-strong)', fontWeight: 'var(--fw-600)', fontSize: 'var(--fs-16)', marginTop: '2px' }}>{span(s)}</p>
                </div>
                <AddToCalendar
                  title={`NID ${c.label} · ${label}`}
                  start={s.start}
                  end={s.end}
                  details={`${label} for the NID Industry Interface ${c.label} placement cycle.`}
                />
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
            <div style={{ marginTop: 'var(--space-8)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
              <a href="/apply" style={{ textDecoration: 'none' }}><Button size="lg">Apply to recruit this cycle</Button></a>
              <a href="/login" style={{ textDecoration: 'none' }}><Button size="md" variant="ghost">Already onboarded? Log in</Button></a>
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
const feeCard = { backgroundColor: 'var(--surface-card)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-2)', padding: 'var(--space-4)' } as const;
const feeLabel = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.04em' };
const feeAmount = { fontSize: 'var(--fs-24)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)', marginTop: 'var(--space-1)' } as const;
const feeNote = { fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 'var(--space-2)' } as const;
const dateRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)', borderBottom: '1px solid var(--border-default)', padding: 'var(--space-3) 0' } as const;
