'use client';

import { useState, type CSSProperties } from 'react';
import { Button, Overlay, StarRating, VoiceInput } from '@nid/ui';

/**
 * LetterDialog (Round 4 §C After) — the offer-decision letter composer.
 *
 * Opens in an `Overlay`. The recruiter writes an optional note, optionally
 * dictates a voicenote (transcribed by `VoiceInput`, accumulated into a hidden
 * field), and leaves an optional `StarRating` review of the interview
 * experience. Submitting posts the injected `sendLetterAction`, which persists
 * the letter, flips `interviewsComplete` (the Offers unlock), advances the
 * pipeline, and redirects to the Offers workspace.
 *
 * The text note is a real `<textarea name="noteMd">`; the voicenote transcript
 * and the star value ride hidden inputs (`StarRating name=` + a controlled
 * hidden field) so the whole thing is a plain server-action form — no client
 * state plumbing crosses to the server beyond the form. This island holds no
 * store.
 *
 * Styled with design tokens only.
 */

export interface LetterDialogProps {
  readonly jdId: string;
  readonly selectedCount: number;
  /** Disabled until at least one candidate is selected + locked. */
  readonly disabled: boolean;
  readonly sendLetterAction: (formData: FormData) => void | Promise<void>;
}

export function LetterDialog({ jdId, selectedCount, disabled, sendLetterAction }: LetterDialogProps) {
  const [open, setOpen] = useState(false);
  const [transcript, setTranscript] = useState('');

  return (
    <>
      <Button type="button" size="sm" onClick={() => setOpen(true)} disabled={disabled}>
        Send decision letter →
      </Button>
      {disabled && (
        <span style={{ ...hint, marginLeft: 'var(--space-3)' }}>Lock your selection first.</span>
      )}

      <Overlay open={open} onClose={() => setOpen(false)} title="Send your decision letter" width="560px">
        <form action={sendLetterAction} style={{ display: 'grid', gap: 'var(--space-4)' }}>
          <input type="hidden" name="jdId" value={jdId} />
          <input type="hidden" name="voiceTranscript" value={transcript} />

          <p style={lead}>
            This sends one decision letter for this JD and unlocks the Offers cascade for your {selectedCount} selected
            candidate{selectedCount === 1 ? '' : 's'}. Everything below is optional.
          </p>

          <label style={{ display: 'grid', gap: 'var(--space-1)' }}>
            <span style={fieldLabel}>Note to the placement cell (optional)</span>
            <textarea
              name="noteMd"
              rows={4}
              placeholder="Anything you want on record about this cohort or your decision…"
              style={textareaStyle}
            />
          </label>

          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <span style={fieldLabel}>Voicenote (optional)</span>
              <VoiceInput onText={(t) => setTranscript((prev) => (prev ? `${prev} ${t}` : t))} label="Dictate voicenote" />
            </div>
            {transcript && (
              <div style={transcriptBox}>
                <p style={{ fontSize: 'var(--fs-13)', color: 'var(--text-strong)' }}>{transcript}</p>
                <button type="button" onClick={() => setTranscript('')} style={clearBtn}>
                  Clear
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gap: 'var(--space-1)' }}>
            <span style={fieldLabel}>Rate this interview experience (optional)</span>
            <StarRating name="reviewStars" label="Interview experience rating" size={28} />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
            <Button type="submit" size="sm">
              Send + unlock Offers
            </Button>
            <button type="button" onClick={() => setOpen(false)} style={cancelBtn}>
              Cancel
            </button>
          </div>
        </form>
      </Overlay>
    </>
  );
}

const lead: CSSProperties = { fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', lineHeight: 'var(--lh-23)' };
const fieldLabel: CSSProperties = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)' };
const hint: CSSProperties = { fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' };
const textareaStyle: CSSProperties = {
  padding: 'var(--input-padding-y) var(--input-padding-x)',
  fontSize: 'var(--fs-14)',
  fontFamily: 'var(--ff-sans)',
  color: 'var(--input-fg)',
  backgroundColor: 'var(--input-bg)',
  border: '1px solid var(--input-border)',
  borderRadius: 'var(--input-radius)',
  resize: 'vertical',
};
const transcriptBox: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 'var(--space-3)',
  padding: 'var(--space-3)',
  backgroundColor: 'var(--surface-panel)',
  borderRadius: 'var(--radius-2)',
  border: '1px solid var(--card-border)',
};
const clearBtn: CSSProperties = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--accent)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  textDecoration: 'underline',
  flexShrink: 0,
};
const cancelBtn: CSSProperties = {
  fontSize: 'var(--fs-14)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-secondary)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
};
