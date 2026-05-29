import { CYCLES, type Cycle } from '~/lib/public-content';

/**
 * Placement-events timetable — the first-glance schedule the live II site leads
 * with. Renders the open cycle's milestones as a horizontal stepper (II-blue
 * accent). Shared by the pre-login homepage and the recruiter dashboard.
 */

function openCycle(): Cycle {
  return CYCLES.find((c) => c.status === 'open') ?? CYCLES[0]!;
}

export function PlacementTimetable({ compact = false }: { compact?: boolean }) {
  const cycle = openCycle();
  const steps: ReadonlyArray<readonly [string, string]> = [
    ['Applications open', cycle.applyOpens],
    ['JD upload deadline', cycle.jdDeadline],
    ['Browsing opens', cycle.browseOpens],
    ['Interview window', cycle.interviewWindow],
    ['Offers by', cycle.offerBy],
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        <p style={{ fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {cycle.label} · placement timetable
        </p>
        <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' }}>
          Participation fee ₹{cycle.feeRupees.toLocaleString('en-IN')} · <a href="/cycles" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 'var(--fw-600)' }}>all dates →</a>
        </p>
      </div>

      <ol
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fit, minmax(${compact ? 120 : 150}px, 1fr))`,
          gap: 'var(--space-2)',
        }}
      >
        {steps.map(([label, date], i) => (
          <li
            key={label}
            style={{
              position: 'relative',
              backgroundColor: 'var(--surface-card)',
              border: '1px solid var(--card-border)',
              borderTop: '3px solid var(--accent)',
              borderRadius: 'var(--radius-2)',
              padding: compact ? 'var(--space-2) var(--space-3)' : 'var(--space-3) var(--space-4)',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: 'var(--radius-pill)', backgroundColor: 'var(--accent)', color: 'var(--accent-text)', fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-700)', marginBottom: 'var(--space-1)' }}>
              {i + 1}
            </span>
            <p style={{ fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
            <p style={{ fontSize: compact ? 'var(--fs-14)' : 'var(--fs-16)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)', marginTop: '2px' }}>{date}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
