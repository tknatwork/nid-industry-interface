import type { CSSProperties } from 'react';
import { StatusPill } from '@nid/ui';

/**
 * AcceptedStudents — the "vacancies locked" panel (Round 4 §D).
 *
 * Plain presentational component (no client state, no store import): the Offers
 * workspace computes the tally from `tallyFor` and the accepted roster from
 * `listOffers(...).filter(accepted)`, then passes plain serializable props here.
 * Shows "{filled}/{positions} vacancies locked" + the accepted students.
 */

export interface AcceptedStudent {
  readonly studentId: string;
  readonly name: string;
  readonly wave: number;
}

export interface AcceptedStudentsProps {
  readonly filled: number;
  readonly positions: number;
  readonly accepted: readonly AcceptedStudent[];
}

export function AcceptedStudents({ filled, positions, accepted }: AcceptedStudentsProps) {
  const complete = filled >= positions;
  const pct = positions > 0 ? Math.min(100, Math.round((filled / positions) * 100)) : 0;

  return (
    <section style={cardStyle} aria-label="Accepted students">
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
        <div>
          <p style={labelStyle}>Vacancies locked</p>
          <p style={{ fontSize: 'var(--fs-28)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)', lineHeight: 1.1 }}>
            {filled}/{positions}
          </p>
        </div>
        <StatusPill tone={complete ? 'success' : filled > 0 ? 'info' : 'neutral'}>
          {complete ? 'All vacancies locked' : `${positions - filled} open`}
        </StatusPill>
      </header>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={positions}
        aria-valuenow={filled}
        aria-label={`${filled} of ${positions} vacancies locked`}
        style={trackStyle}
      >
        <div style={{ ...fillStyle, width: `${pct}%` }} />
      </div>

      {accepted.length === 0 ? (
        <p style={{ ...hint, marginTop: 'var(--space-3)' }}>No acceptances yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 'var(--space-4) 0 0', padding: 0, display: 'grid', gap: 'var(--space-2)' }}>
          {accepted.map((a) => (
            <li key={a.studentId} style={rowStyle}>
              <span style={{ fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>{a.name}</span>
              <StatusPill tone="success">Accepted · wave {a.wave}</StatusPill>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const cardStyle: CSSProperties = {
  backgroundColor: 'var(--surface-card)',
  border: '1px solid var(--card-border)',
  borderRadius: 'var(--card-radius)',
  padding: 'var(--card-padding)',
};
const labelStyle: CSSProperties = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};
const hint: CSSProperties = { fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' };
const trackStyle: CSSProperties = {
  width: '100%',
  height: 'var(--space-2)',
  borderRadius: 'var(--radius-full)',
  backgroundColor: 'var(--surface-panel)',
  overflow: 'hidden',
};
const fillStyle: CSSProperties = {
  height: '100%',
  backgroundColor: 'var(--green-500, var(--accent))',
  borderRadius: 'var(--radius-full)',
  transition: 'width var(--motion-micro)',
};
const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--space-3)',
  padding: 'var(--space-2) var(--space-3)',
  backgroundColor: 'var(--surface-panel)',
  borderRadius: 'var(--radius-2)',
};
