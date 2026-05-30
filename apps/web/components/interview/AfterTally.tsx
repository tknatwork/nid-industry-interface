'use client';

import { useState, type CSSProperties } from 'react';
import { Button, StatusPill } from '@nid/ui';
import type { TallyVM, LetterVM } from '~/components/workspace/interview-workspace-data';
import { LetterDialog } from './LetterDialog';

/**
 * AfterTally (Round 4 §C After) — select the offer pool, then send the letter.
 *
 * Shows every tallied candidate with their per-round scores + total, alongside
 * the JD's vacancy count. The recruiter ticks who to select — the selection MAY
 * exceed vacancies (the offer cascade enforces the hard cap downstream, not
 * here) — and "Lock selection" posts `lockSelectionAction`: the ticked ids ride
 * `name="selected"`, and every tallied id rides a hidden `considered` field so
 * the action can mark the un-ticked as rejected.
 *
 * Once a selection is locked, `LetterDialog` becomes available; sending the
 * letter is the Offers unlock. A previously sent letter renders as a read-only
 * summary. This island holds no store — selection state is local, persisted only
 * through the injected server-action form.
 *
 * Styled with design tokens only.
 */

export interface AfterTallyProps {
  readonly jdId: string;
  readonly positions: number;
  readonly tally: readonly TallyVM[];
  readonly finalRound: number;
  readonly interviewsComplete: boolean;
  readonly selectedCount: number;
  readonly letter?: LetterVM;
  readonly lockSelectionAction: (formData: FormData) => void | Promise<void>;
  readonly sendLetterAction: (formData: FormData) => void | Promise<void>;
}

export function AfterTally({
  jdId,
  positions,
  tally,
  finalRound,
  interviewsComplete,
  selectedCount,
  letter,
  lockSelectionAction,
  sendLetterAction,
}: AfterTallyProps) {
  const ranked = tally.slice().sort((a, b) => b.total - a.total);
  // Pre-tick anyone already marked selected (e.g. returning to this tab).
  const [picked, setPicked] = useState<Set<string>>(
    () => new Set(tally.filter((t) => t.decision === 'selected').map((t) => t.studentId)),
  );
  const locked = selectedCount > 0;

  if (tally.length === 0) {
    return (
      <p style={notice}>
        No tally yet. Finish the rounds in the During tab — the final-round advance builds the tally here.
      </p>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 'var(--space-5)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <div>
          <p style={cardLabel}>Final tally</p>
          <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)' }}>
            {positions} vacanc{positions === 1 ? 'y' : 'ies'} · select as many as you want (you may over-select; the
            offer cascade caps acceptances).
          </p>
        </div>
        <StatusPill tone={locked ? 'success' : 'info'}>
          {picked.size} selected{locked ? ' · locked' : ''}
        </StatusPill>
      </div>

      <form action={lockSelectionAction} style={{ display: 'grid', gap: 'var(--space-3)' }}>
        <input type="hidden" name="jdId" value={jdId} />
        {/* Every tallied candidate is "considered" so the action can reject the unticked. */}
        {ranked.map((t) => (
          <input key={`c-${t.studentId}`} type="hidden" name="considered" value={t.studentId} />
        ))}

        <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
          {ranked.map((t, i) => {
            const isPicked = picked.has(t.studentId);
            return (
              <label key={t.studentId} style={{ ...row, ...(isPicked ? rowPicked : {}) }}>
                <input
                  type="checkbox"
                  name="selected"
                  value={t.studentId}
                  checked={isPicked}
                  disabled={locked}
                  onChange={(e) =>
                    setPicked((prev) => {
                      const next = new Set(prev);
                      if (e.target.checked) next.add(t.studentId);
                      else next.delete(t.studentId);
                      return next;
                    })
                  }
                  style={{ accentColor: 'var(--accent)', width: '1.1rem', height: '1.1rem', marginTop: '2px' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 'var(--fs-16)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)' }}>
                      {i + 1}. {t.name}
                    </span>
                    <span style={{ fontSize: 'var(--fs-16)', fontWeight: 'var(--fw-700)', color: 'var(--text-strong)' }}>
                      {t.total}
                    </span>
                  </div>
                  <span style={muted}>{t.disciplineName}</span>
                  <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap', marginTop: 'var(--space-1)' }}>
                    {t.perRound.map((score, idx) => (
                      <span key={idx} style={scoreChip}>
                        R{idx + 1} · {score === undefined ? '—' : `${score}/10`}
                      </span>
                    ))}
                    {!t.reachedFinal && <span style={{ ...muted, alignSelf: 'center' }}>did not reach round {finalRound}</span>}
                  </div>
                </div>
              </label>
            );
          })}
        </div>

        {!locked && (
          <div>
            <Button type="submit" size="sm" disabled={picked.size === 0}>
              Lock selection ({picked.size})
            </Button>
            {picked.size === 0 && <span style={{ ...muted, marginLeft: 'var(--space-3)' }}>Tick at least one candidate.</span>}
          </div>
        )}
      </form>

      {/* Decision letter — available once a selection is locked. */}
      <div style={{ ...card, backgroundColor: 'var(--surface-panel)' }}>
        {letter ? (
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <StatusPill tone="success">Decision letter sent</StatusPill>
              {interviewsComplete && (
                <a href={`/recruiter/offers?jd=${encodeURIComponent(jdId)}`} style={{ textDecoration: 'none', marginLeft: 'auto' }}>
                  <Button size="sm">Go to offers →</Button>
                </a>
              )}
            </div>
            {letter.noteMd && (
              <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)' }}>
                <span style={{ fontWeight: 'var(--fw-600)' }}>Note: </span>
                {letter.noteMd}
              </p>
            )}
            {letter.voiceTranscript && (
              <p style={{ fontSize: 'var(--fs-13)', color: 'var(--text-secondary)' }}>
                <span style={{ fontWeight: 'var(--fw-600)' }}>Voicenote: </span>
                {letter.voiceTranscript}
              </p>
            )}
            {letter.reviewStars !== undefined && (
              <p style={muted}>Experience rating: {letter.reviewStars}/5</p>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            <p style={{ fontSize: 'var(--fs-16)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)' }}>
              Send your decision
            </p>
            <p style={muted}>
              One letter for this JD: an optional note, an optional voicenote, and a quick experience rating. Sending it
              unlocks the Offers cascade.
            </p>
            <div>
              <LetterDialog
                jdId={jdId}
                selectedCount={Math.max(selectedCount, picked.size)}
                disabled={!locked}
                sendLetterAction={sendLetterAction}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const cardLabel: CSSProperties = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};
const muted: CSSProperties = { fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' };
const card: CSSProperties = {
  backgroundColor: 'var(--surface-card)',
  border: '1px solid var(--card-border)',
  borderRadius: 'var(--card-radius)',
  padding: 'var(--card-padding)',
};
const row: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 'var(--space-3)',
  backgroundColor: 'var(--surface-card)',
  border: '1px solid var(--card-border)',
  borderRadius: 'var(--radius-2)',
  padding: 'var(--space-3)',
  cursor: 'pointer',
};
const rowPicked: CSSProperties = {
  borderColor: 'var(--accent)',
  backgroundColor: 'color-mix(in oklch, var(--accent), white 90%)',
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
const notice: CSSProperties = {
  fontSize: 'var(--fs-14)',
  color: 'var(--text-secondary)',
  padding: 'var(--space-6)',
  backgroundColor: 'var(--surface-card)',
  borderRadius: 'var(--radius-2)',
  border: '1px dashed var(--border-emphasized)',
  textAlign: 'center',
};
