'use client';

import type { CSSProperties } from 'react';
import { Button, StatusPill } from '@nid/ui';
import type { RoundVM, DuringRowVM, TallyVM } from '~/components/workspace/interview-workspace-data';
import type { TransportMode } from '@nid/module-interview-console';

/**
 * DuringRounds (Round 4 §C During) — run the interview rounds one at a time.
 *
 * Shows ONLY the candidates eligible in the current round (`candidatesForRound`
 * resolved server-side). For each, a score (0–10) + remarks form posts to the
 * injected `recordOutcomeAction`. "Shortlist round N → advance" posts
 * `advanceRoundAction`, which locks the advancers through to round N+1 and
 * buckets the rest. On the FINAL round the advance is flagged `isFinal` so the
 * action also computes the tally + moves the pipeline to `tallied`; the tally
 * preview renders here once it exists.
 *
 * Every outcome verb is its own submit button carrying `name="outcome"`, so the
 * clicked verb contributes directly to the FormData (no client state race),
 * mirroring the canonical client-island pattern. This island holds no store.
 *
 * Styled with design tokens only.
 */

export interface DuringRoundsProps {
  readonly jdId: string;
  readonly rounds: readonly RoundVM[];
  readonly currentRound: number;
  readonly finalRound: number;
  readonly during: readonly DuringRowVM[];
  readonly tally: readonly TallyVM[];
  readonly transport: TransportMode;
  readonly recordOutcomeAction: (formData: FormData) => void | Promise<void>;
  readonly advanceRoundAction: (formData: FormData) => void | Promise<void>;
  readonly setTransportAction: (formData: FormData) => void | Promise<void>;
}

const TRANSPORTS: ReadonlyArray<{ key: TransportMode; label: string; hint: string }> = [
  { key: 'live', label: 'Live push', hint: 'SSE · instant · best on stable Wi-Fi' },
  { key: 'periodic', label: 'Periodic 15s', hint: 'lower battery · better on flaky Wi-Fi' },
  { key: 'manual', label: 'Manual', hint: 'pull-to-refresh · offline-friendly' },
];

export function DuringRounds({
  jdId,
  rounds,
  currentRound,
  finalRound,
  during,
  tally,
  transport,
  recordOutcomeAction,
  advanceRoundAction,
  setTransportAction,
}: DuringRoundsProps) {
  const roundLabel = rounds.find((r) => r.round === currentRound)?.label ?? `Round ${currentRound}`;
  const isFinal = currentRound >= finalRound;
  const tallied = tally.length > 0 && tally.some((t) => t.reachedFinal);

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', display: 'grid', gap: 'var(--space-5)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <div>
          <p style={cardLabel}>Now running</p>
          <p style={{ fontSize: 'var(--fs-20)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)' }}>
            Round {currentRound} of {finalRound} · {roundLabel}
          </p>
        </div>
        <StatusPill tone={isFinal ? 'success' : 'warning'}>{isFinal ? 'Final round' : 'In progress'}</StatusPill>
      </div>

      {during.length === 0 ? (
        <p style={notice}>
          No candidates eligible in round {currentRound}. Advance the prior round, or check the Before tab to place
          candidates.
        </p>
      ) : (
        <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
          {during.map((row) => (
            <div key={row.studentId} style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                <p style={{ fontSize: 'var(--fs-16)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)' }}>{row.name}</p>
                <span style={muted}>{row.disciplineName}</span>
              </div>

              {row.perRound.length > 0 && (
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: 'var(--space-2)' }}>
                  {row.perRound.map((rr) => (
                    <span key={rr.round} style={scoreChip}>
                      R{rr.round} · {rr.outcome}
                      {rr.score !== undefined ? ` · ${rr.score}/10` : ''}
                    </span>
                  ))}
                </div>
              )}

              <OutcomeForm
                jdId={jdId}
                studentId={row.studentId}
                round={row.nextRound}
                finalRound={finalRound}
                recordOutcomeAction={recordOutcomeAction}
              />
            </div>
          ))}

          {/* Shortlist round N → advance */}
          <form action={advanceRoundAction} style={advanceBar}>
            <input type="hidden" name="jdId" value={jdId} />
            <input type="hidden" name="round" value={currentRound} />
            <input type="hidden" name="isFinal" value={isFinal ? 'true' : 'false'} />
            <div>
              <p style={{ fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)' }}>
                {isFinal ? `Finish round ${currentRound} → tally` : `Shortlist round ${currentRound} → advance`}
              </p>
              <p style={muted}>
                {isFinal
                  ? 'Locks everyone’s final results and builds the After-phase tally.'
                  : `Candidates marked “advance” move to round ${currentRound + 1}; the rest are held out.`}
              </p>
            </div>
            <Button type="submit" size="sm">
              {isFinal ? 'Tally results' : `Advance → R${currentRound + 1}`}
            </Button>
          </form>
        </div>
      )}

      {tallied && (
        <div style={card}>
          <p style={cardLabel}>Tally preview</p>
          <div style={{ display: 'grid', gap: 'var(--space-1)', marginTop: 'var(--space-2)' }}>
            {tally
              .slice()
              .sort((a, b) => b.total - a.total)
              .map((t) => (
                <div key={t.studentId} style={tallyRow}>
                  <span style={{ fontSize: 'var(--fs-14)', color: 'var(--text-strong)' }}>{t.name}</span>
                  <span style={{ fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)' }}>{t.total}</span>
                </div>
              ))}
          </div>
          <p style={{ ...muted, marginTop: 'var(--space-2)' }}>Go to the After tab to select and send your decision.</p>
        </div>
      )}

      {/* Transport settings — the live-console cadence. */}
      <div style={{ ...card, backgroundColor: 'var(--surface-panel)' }}>
        <p style={{ ...cardLabel, marginBottom: 'var(--space-3)' }}>Live update mode</p>
        <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
          {TRANSPORTS.map((t) => (
            <form key={t.key} action={setTransportAction}>
              <input type="hidden" name="jdId" value={jdId} />
              <input type="hidden" name="mode" value={t.key} />
              <button
                type="submit"
                aria-pressed={transport === t.key}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-2)',
                  border: `1px solid ${transport === t.key ? 'var(--accent)' : 'var(--border-default)'}`,
                  backgroundColor:
                    transport === t.key ? 'color-mix(in oklch, var(--accent), white 85%)' : 'var(--surface-card)',
                  cursor: 'pointer',
                }}
              >
                <span>
                  <span style={{ fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)' }}>{t.label}</span>
                  <span style={{ display: 'block', fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' }}>{t.hint}</span>
                </span>
                {transport === t.key && <StatusPill tone="success">Active</StatusPill>}
              </button>
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}

function OutcomeForm({
  jdId,
  studentId,
  round,
  finalRound,
  recordOutcomeAction,
}: {
  jdId: string;
  studentId: string;
  round: number;
  finalRound: number;
  recordOutcomeAction: (formData: FormData) => void | Promise<void>;
}) {
  const target = Math.min(Math.max(round, 1), finalRound);
  return (
    <form action={recordOutcomeAction} style={{ marginTop: 'var(--space-3)', display: 'grid', gap: 'var(--space-3)' }}>
      <input type="hidden" name="jdId" value={jdId} />
      <input type="hidden" name="studentId" value={studentId} />
      <input type="hidden" name="round" value={target} />

      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <label style={{ display: 'grid', gap: 'var(--space-1)' }}>
          <span style={fieldLabel}>Score (0–10)</span>
          <input
            type="number"
            name="score"
            min={0}
            max={10}
            step={0.5}
            inputMode="decimal"
            aria-label={`Score for round ${target}`}
            style={{ ...inputStyle, width: '6rem' }}
          />
        </label>
        <label style={{ display: 'grid', gap: 'var(--space-1)', flex: '1 1 220px' }}>
          <span style={fieldLabel}>Remarks</span>
          <input
            type="text"
            name="note"
            placeholder="What stood out this round"
            aria-label={`Remarks for round ${target}`}
            style={inputStyle}
          />
        </label>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        <Button type="submit" name="outcome" value="advance" size="sm">
          Advance
        </Button>
        <Button type="submit" name="outcome" value="hold" size="sm" variant="secondary">
          Hold
        </Button>
        <Button type="submit" name="outcome" value="reject" size="sm" variant="ghost">
          Reject
        </Button>
      </div>
    </form>
  );
}

const cardLabel: CSSProperties = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};
const fieldLabel: CSSProperties = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)' };
const muted: CSSProperties = { fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' };
const card: CSSProperties = {
  backgroundColor: 'var(--surface-card)',
  border: '1px solid var(--card-border)',
  borderRadius: 'var(--card-radius)',
  padding: 'var(--card-padding)',
};
const advanceBar: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 'var(--space-3)',
  flexWrap: 'wrap',
  backgroundColor: 'var(--surface-panel)',
  border: '1px solid var(--card-border)',
  borderRadius: 'var(--card-radius)',
  padding: 'var(--card-padding)',
};
const inputStyle: CSSProperties = {
  minHeight: 'var(--input-min-height)',
  padding: 'var(--input-padding-y) var(--input-padding-x)',
  fontSize: 'var(--fs-14)',
  fontFamily: 'var(--ff-sans)',
  color: 'var(--input-fg)',
  backgroundColor: 'var(--input-bg)',
  border: '1px solid var(--input-border)',
  borderRadius: 'var(--input-radius)',
};
const scoreChip: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: 'var(--space-1) var(--space-2)',
  borderRadius: 'var(--radius-full)',
  backgroundColor: 'var(--surface-panel)',
  color: 'var(--text-strong)',
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
};
const tallyRow: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: 'var(--space-2) var(--space-3)',
  borderRadius: 'var(--radius-2)',
  backgroundColor: 'var(--surface-panel)',
};
const notice: CSSProperties = {
  fontSize: 'var(--fs-14)',
  color: 'var(--text-secondary)',
  padding: 'var(--space-6)',
  backgroundColor: 'var(--surface-card)',
  borderRadius: 'var(--radius-2)',
  border: '1px dashed var(--border-emphasized)',
  textAlign: 'center',
};
