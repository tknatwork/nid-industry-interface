'use client';

import { useState } from 'react';
import { Button, StatusPill, type StatusTone } from '@nid/ui';
import type { Attendance, RoundOutcome, RoundProgress } from '@nid/module-interview-console';

/**
 * CoordinatorRoundEditor (plan §Q surface (b)) — the student coordinator's
 * round-progress editor for ONE selected candidate. Records per-round outcomes
 * (advance / hold / reject) and sets coordination signals (arrived / in another
 * interview + ETA / running late) by submitting the scope-checked server
 * actions passed in as props. Both write the SHARED interview-console store, so
 * the recruiter's interview console reflects every change on its next refresh.
 *
 * Client component: it owns lightweight UI state only (chosen outcome, ETA
 * draft, late draft). The mutations themselves are server actions — no client
 * data fetching, no optimistic state to drift out of sync with the store.
 */
export interface CoordinatorRoundEditorProps {
  readonly recruiterId: string;
  readonly jdId: string;
  readonly studentId: string;
  readonly studentName: string;
  /** Total interview rounds the JD declared, so the round selector is bounded. */
  readonly totalRounds: number;
  /** Live record from the shared store (drives the current state shown). */
  readonly progress: RoundProgress;
  /** Scope-checked server actions (defined in the route's actions.ts). */
  readonly recordOutcomeAction: (formData: FormData) => void | Promise<void>;
  readonly setSignalAction: (formData: FormData) => void | Promise<void>;
}

const OUTCOMES: ReadonlyArray<{ value: RoundOutcome; label: string; tone: StatusTone }> = [
  { value: 'advance', label: 'Advance', tone: 'success' },
  { value: 'hold', label: 'Hold', tone: 'warning' },
  { value: 'reject', label: 'Reject', tone: 'danger' },
];

const ATTENDANCE_LABEL: Record<Attendance, string> = {
  expected: 'Expected',
  arrived: 'Arrived',
  'in-interview': 'In interview',
  done: 'Done',
};

const ATTENDANCE_TONE: Record<Attendance, StatusTone> = {
  expected: 'neutral',
  arrived: 'info',
  'in-interview': 'success',
  done: 'neutral',
};

export function CoordinatorRoundEditor({
  recruiterId,
  jdId,
  studentId,
  studentName,
  totalRounds,
  progress,
  recordOutcomeAction,
  setSignalAction,
}: CoordinatorRoundEditorProps) {
  // The round we are recording an outcome for defaults to the current round
  // (1-based; the store seeds currentRound = 0 before the first outcome, so we
  // record into round 1 first).
  const nextRound = Math.min(Math.max(progress.currentRound, 0) + 1, Math.max(totalRounds, 1));
  const [outcome, setOutcome] = useState<RoundOutcome>('advance');
  const { coordination } = progress;

  const hidden = (
    <>
      <input type="hidden" name="recruiterId" value={recruiterId} />
      <input type="hidden" name="jdId" value={jdId} />
      <input type="hidden" name="studentId" value={studentId} />
    </>
  );

  return (
    <div
      style={{
        backgroundColor: 'var(--surface-card)',
        border: '1px solid var(--card-border)',
        borderRadius: 'var(--card-radius)',
        padding: 'var(--card-padding)',
        display: 'grid',
        gap: 'var(--space-4)',
      }}
    >
      {/* Candidate header + live state */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontSize: 'var(--fs-16)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)' }}>{studentName}</p>
          <p style={labelStyle}>
            Round {Math.max(progress.currentRound, 0)} of {Math.max(totalRounds, 1)} · decision: {progress.decision}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <StatusPill tone={ATTENDANCE_TONE[coordination.attendance]}>{ATTENDANCE_LABEL[coordination.attendance]}</StatusPill>
          {coordination.inAnotherInterview && (
            <StatusPill tone="warning">
              in another interview{coordination.etaBack ? ` · ETA ${coordination.etaBack}` : ''}
            </StatusPill>
          )}
          {typeof coordination.runningLateMin === 'number' && coordination.runningLateMin > 0 && (
            <StatusPill tone="warning">running {coordination.runningLateMin} min late</StatusPill>
          )}
        </div>
      </div>

      {/* Coordination signals — attendance quick-actions (§Q). */}
      <div>
        <p style={{ ...labelStyle, marginBottom: 'var(--space-2)' }}>Mark attendance</p>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {(['arrived', 'in-interview', 'done'] as const).map((a) => (
            <form key={a} action={setSignalAction}>
              {hidden}
              <input type="hidden" name="attendance" value={a} />
              <Button type="submit" size="sm" variant={coordination.attendance === a ? 'primary' : 'secondary'}>
                {ATTENDANCE_LABEL[a]}
              </Button>
            </form>
          ))}
        </div>
      </div>

      {/* "In another interview" + ETA, and running-late — the cross-interview
          conflict signal the recruiter console reads anonymized (§4.17/§Q). */}
      <div style={{ display: 'grid', gap: 'var(--space-3)', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <form action={setSignalAction} style={signalCard}>
          {hidden}
          <input type="hidden" name="inAnotherInterview" value="true" />
          <p style={labelStyle}>In another interview</p>
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={miniLabel}>
              ETA back
              <input
                type="time"
                name="etaBack"
                defaultValue={coordination.etaBack ?? ''}
                style={inputStyle}
                aria-label={`ETA back for ${studentName}`}
              />
            </label>
            <Button type="submit" size="sm" variant="secondary">Flag</Button>
          </div>
        </form>

        <form action={setSignalAction} style={signalCard}>
          {hidden}
          <input type="hidden" name="inAnotherInterview" value="false" />
          <input type="hidden" name="attendance" value="arrived" />
          <p style={labelStyle}>Back / available</p>
          <Button type="submit" size="sm" variant="secondary">Clear conflict</Button>
        </form>

        <form action={setSignalAction} style={signalCard}>
          {hidden}
          <p style={labelStyle}>Running late</p>
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={miniLabel}>
              Minutes
              <input
                type="number"
                name="runningLateMin"
                min={0}
                max={240}
                defaultValue={coordination.runningLateMin ?? 0}
                style={{ ...inputStyle, width: '5rem' }}
                aria-label={`Minutes late for ${studentName}`}
              />
            </label>
            <Button type="submit" size="sm" variant="secondary">Update</Button>
          </div>
        </form>
      </div>

      {/* Round outcome recorder — writes to the shared store; recruiter console
          reads the resulting currentRound + decision (§O/§Q). */}
      <form action={recordOutcomeAction} style={{ ...signalCard, display: 'grid', gap: 'var(--space-3)' }}>
        {hidden}
        <input type="hidden" name="round" value={nextRound} />
        <p style={labelStyle}>Record round {nextRound} outcome</p>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {OUTCOMES.map((o) => (
            <label
              key={o.value}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-2)',
                border: `1px solid ${outcome === o.value ? 'var(--accent)' : 'var(--border-default)'}`,
                backgroundColor: outcome === o.value ? 'color-mix(in oklch, var(--accent), white 85%)' : 'var(--surface-card)',
                cursor: 'pointer',
                fontSize: 'var(--fs-14)',
                fontWeight: 'var(--fw-600)',
                color: 'var(--text-strong)',
              }}
            >
              <input
                type="radio"
                name="outcome"
                value={o.value}
                checked={outcome === o.value}
                onChange={() => setOutcome(o.value)}
              />
              {o.label}
            </label>
          ))}
        </div>
        <label style={{ ...miniLabel, width: '100%' }}>
          Note (optional)
          <input
            type="text"
            name="note"
            maxLength={200}
            placeholder="e.g. strong systems thinking — advance to round 2"
            style={{ ...inputStyle, width: '100%' }}
            aria-label={`Round note for ${studentName}`}
          />
        </label>
        <div>
          <Button type="submit" size="sm">Record outcome</Button>
        </div>
      </form>

      {/* Recorded rounds so far */}
      {progress.perRound.length > 0 && (
        <div>
          <p style={{ ...labelStyle, marginBottom: 'var(--space-2)' }}>Recorded rounds</p>
          <ul style={{ display: 'grid', gap: 'var(--space-1)', margin: 0, padding: 0, listStyle: 'none' }}>
            {progress.perRound.map((r) => (
              <li
                key={r.round}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 'var(--space-3)',
                  fontSize: 'var(--fs-13)',
                  color: 'var(--text-secondary)',
                  paddingBlock: 'var(--space-1)',
                  borderBottom: '1px solid var(--border-default)',
                }}
              >
                <span style={{ color: 'var(--text-strong)', fontWeight: 'var(--fw-600)' }}>
                  Round {r.round}: {r.outcome}
                </span>
                <span>{r.note ?? '—'}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const labelStyle = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
};

const miniLabel = {
  display: 'inline-flex',
  flexDirection: 'column' as const,
  gap: 'var(--space-1)',
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-secondary)',
};

const inputStyle = {
  minHeight: 'var(--input-min-height)',
  padding: 'var(--input-padding-y) var(--input-padding-x)',
  fontSize: 'var(--fs-14)',
  fontFamily: 'var(--ff-sans)',
  color: 'var(--input-fg)',
  backgroundColor: 'var(--input-bg)',
  border: '1px solid var(--input-border)',
  borderRadius: 'var(--input-radius)',
};

const signalCard = {
  backgroundColor: 'var(--surface-panel)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-3)',
  padding: 'var(--space-3) var(--space-4)',
};
