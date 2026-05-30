'use client';

import { useState, type CSSProperties } from 'react';
import { Button } from '@nid/ui';
import type { RoundVM, SlotVM, PlanAssignmentVM } from '~/components/workspace/interview-workspace-data';

/**
 * PlanSetupForm (Round 4 §C Before) — the duration + rounds header of the
 * interview plan.
 *
 * The rounds themselves are SEEDED from the JD's `interviewRounds` server-side
 * (immutable here — a recruiter can't invent rounds the JD never declared), so
 * this form's editable surface is the per-round duration. On submit it posts the
 * full plan draft (duration + the seeded rounds + the existing slots +
 * assignments, untouched) as a JSON string in a hidden `draft` field to the
 * injected `savePlanAction`, which validates it with `planDraftSchema` and
 * persists. This island holds no store — it persists ONLY through the form.
 *
 * Styled with design tokens only.
 */

export interface PlanSetupFormProps {
  readonly jdId: string;
  readonly durationMin: number;
  readonly rounds: readonly RoundVM[];
  readonly slots: readonly SlotVM[];
  readonly assignments: readonly PlanAssignmentVM[];
  readonly savePlanAction: (formData: FormData) => void | Promise<void>;
}

export function PlanSetupForm({
  jdId,
  durationMin,
  rounds,
  slots,
  assignments,
  savePlanAction,
}: PlanSetupFormProps) {
  const [duration, setDuration] = useState(durationMin);

  // The full draft persisted on submit. Rounds/slots/assignments pass through
  // unchanged; only the duration is editable here. Slot durations track the
  // per-round duration so the timeline columns stay consistent.
  const draft = {
    jdId,
    durationMin: duration,
    rounds: rounds.map((r) => ({ round: r.round, label: r.label })),
    slots: slots.map((s) => ({ slotId: s.slotId, startTime: s.startTime, durationMin: duration })),
    assignments: assignments.map((a) => ({
      studentId: a.studentId,
      slotId: a.slotId,
      round: a.round,
      interviewerIds: [...a.interviewerIds],
    })),
  };

  return (
    <form action={savePlanAction} style={card}>
      <input type="hidden" name="jdId" value={jdId} />
      <input type="hidden" name="draft" value={JSON.stringify(draft)} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <p style={cardLabel}>Plan setup</p>
        <span style={hint}>{rounds.length} round{rounds.length === 1 ? '' : 's'} · seeded from this JD</span>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <label style={{ display: 'grid', gap: 'var(--space-1)' }}>
          <span style={fieldLabel}>Per-round duration (min)</span>
          <input
            type="number"
            value={duration}
            min={5}
            max={180}
            step={5}
            inputMode="numeric"
            onChange={(e) => setDuration(Math.max(5, Math.min(180, Number(e.target.value) || 5)))}
            aria-label="Per-round interview duration in minutes"
            style={{ ...inputStyle, width: '8rem' }}
          />
        </label>
        <Button type="submit" size="sm" variant="secondary">
          Save duration
        </Button>
      </div>

      <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
        <span style={fieldLabel}>Rounds</span>
        <ol style={{ margin: 0, paddingLeft: 'var(--space-5)', display: 'grid', gap: 'var(--space-1)' }}>
          {rounds.map((r) => (
            <li key={r.round} style={{ fontSize: 'var(--fs-14)', color: 'var(--text-strong)' }}>
              {r.label}
            </li>
          ))}
        </ol>
      </div>
    </form>
  );
}

const card: CSSProperties = {
  display: 'grid',
  gap: 'var(--space-4)',
  backgroundColor: 'var(--surface-card)',
  border: '1px solid var(--card-border)',
  borderRadius: 'var(--card-radius)',
  padding: 'var(--card-padding)',
};
const cardLabel: CSSProperties = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};
const fieldLabel: CSSProperties = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)' };
const hint: CSSProperties = { fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' };
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
