import { CYCLES, type Cycle, type DateSpan } from '~/lib/public-content';
import { AddToCalendar } from './AddToCalendar';

/**
 * Placement-events timetable — the first-glance schedule the live II site leads
 * with. Renders the open cycle's milestones as a horizontal stepper (II-blue
 * accent), each step showing its start→end span and a per-activity
 * add-to-calendar control. Shared by the pre-login homepage and the recruiter
 * dashboard.
 *
 * Server component that composes the client `AddToCalendar` child per step.
 */

function openCycle(): Cycle {
  return CYCLES.find((c) => c.status === 'open') ?? CYCLES[0]!;
}

/** Human span: '01 Jun 2026 – 05 Jun 2026', collapsed to one date when equal. */
function spanLabel(s: DateSpan): string {
  return s.start === s.end ? s.start : `${s.start} – ${s.end}`;
}

interface Step {
  readonly label: string;
  readonly span: DateSpan;
}

export function PlacementTimetable({ compact = false }: { compact?: boolean }) {
  const cycle = openCycle();
  const a = cycle.activities;
  const steps: readonly Step[] = [
    { label: 'Applications', span: a.applications },
    { label: 'JD upload deadline', span: a.jdDeadline },
    { label: 'Browsing opens', span: a.browsing },
    { label: 'Interview window', span: a.interviewWindow },
    { label: 'Offers', span: a.offers },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        <p style={{ fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {cycle.label} · placement timeline
        </p>
        <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' }}>
          Participation fee ₹{cycle.participationFeeRupees.toLocaleString('en-IN')} · <a href="/cycles" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 'var(--fw-600)' }}>all dates →</a>
        </p>
      </div>

      <ol
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fit, minmax(${compact ? 150 : 190}px, 1fr))`,
          gap: 'var(--space-2)',
        }}
      >
        {steps.map(({ label, span }, i) => (
          <li
            key={label}
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-1)',
              backgroundColor: 'var(--surface-card)',
              border: '1px solid var(--card-border)',
              borderTop: '3px solid var(--accent)',
              borderRadius: 'var(--radius-2)',
              padding: compact ? 'var(--space-2) var(--space-3)' : 'var(--space-3) var(--space-4)',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: 'var(--radius-pill)', backgroundColor: 'var(--accent)', color: 'var(--accent-text)', fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-700)' }}>
              {i + 1}
            </span>
            <p style={{ fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
            <p style={{ fontSize: compact ? 'var(--fs-14)' : 'var(--fs-16)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)' }}>{spanLabel(span)}</p>
            {!compact && (
              <div style={{ marginTop: 'var(--space-1)' }}>
                <AddToCalendar
                  title={`NID ${cycle.label} · ${label}`}
                  start={span.start}
                  end={span.end}
                  details={`${label} for the NID Industry Interface ${cycle.label} placement cycle.`}
                />
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
