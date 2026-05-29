import type { Metadata } from 'next';
import { PageShell, StatusPill, type StatusTone } from '@nid/ui';
import { CURRENT_CYCLES, ARCHIVED_CYCLES, type Cycle } from '~/lib/public-content';
import { AcademicCalendarOverlay } from '~/components/AcademicCalendarOverlay';

export const metadata: Metadata = {
  title: 'Timeline · NID Industry Interface',
  description: 'Placement cycles, key dates, fees, and eligibility.',
};

export default function TimelinePage() {
  return (
    <PageShell activeNav="cycles">
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--layout-section-y)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
            <div>
              <p style={kicker}>Two windows a year</p>
              <h1 style={h1}>Timeline</h1>
            </div>
            <AcademicCalendarOverlay />
          </div>

          <p style={lead}>
            Each cycle carries two payments: a <strong>participation fee of ₹15,000</strong> (non-refundable, paid at
            sign-up) and a <strong>student-mentor / faculty-guidance fee of ₹5,000 per student</strong>, invoiced to the
            company <em>after</em> a hired student joins and starts their Graduation Project — <strong>not applicable to
            full-time hires</strong>.
          </p>

          <h2 style={sectionLabel}>This year</h2>
          <div style={{ display: 'grid', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
            {CURRENT_CYCLES.map((c) => (
              <CycleRow key={c.slug} cycle={c} />
            ))}
          </div>

          {ARCHIVED_CYCLES.length > 0 && (
            <>
              <h2 style={sectionLabel}>Archive</h2>
              <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
                Closed cycles from the last two years.
              </p>
              <div style={{ display: 'grid', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
                {ARCHIVED_CYCLES.map((c) => (
                  <CycleRow key={c.slug} cycle={c} muted />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </PageShell>
  );
}

function CycleRow({ cycle: c, muted = false }: { cycle: Cycle; muted?: boolean }) {
  return (
    <a href={`/cycles/${c.slug}`} style={{ ...row, ...(muted ? rowMuted : null) }}>
      <div>
        <p style={{ fontSize: muted ? 'var(--fs-18)' : 'var(--fs-20)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>{c.label}</p>
        <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', marginTop: '2px' }}>
          Applications {c.activities.applications.start} – {c.activities.applications.end} · interviews {c.activities.interviewWindow.start} – {c.activities.interviewWindow.end}
        </p>
        <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', marginTop: '2px' }}>
          ₹{c.participationFeeRupees.toLocaleString('en-IN')} participation · ₹{c.gpFeePerStudentRupees.toLocaleString('en-IN')}/student GP fee
        </p>
      </div>
      <StatusPill tone={tone(c.status)}>{c.status}</StatusPill>
    </a>
  );
}

function tone(s: Cycle['status']): StatusTone {
  return s === 'open' ? 'success' : s === 'upcoming' ? 'info' : 'neutral';
}
const kicker = { fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-600)', color: 'var(--accent)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 'var(--space-2)' };
const h1 = { fontSize: 'var(--fs-48)', lineHeight: 'var(--lh-56)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' };
const lead = { fontSize: 'var(--fs-16)', lineHeight: 1.6, color: 'var(--text-secondary)', marginTop: 'var(--space-4)', maxWidth: '760px' } as const;
const sectionLabel = { fontSize: 'var(--fs-24)', lineHeight: 'var(--lh-28)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginTop: 'var(--space-8)' };
const row = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)', backgroundColor: 'var(--card-bg)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)', boxShadow: 'var(--card-shadow)', textDecoration: 'none' } as const;
const rowMuted = { boxShadow: 'none', border: '1px solid var(--border-default)', backgroundColor: 'var(--surface-panel)' } as const;
