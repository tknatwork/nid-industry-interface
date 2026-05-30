'use client';

import { useState, type CSSProperties } from 'react';
import { Button, StarRating } from '@nid/ui';

/**
 * Recruiter experience widget (Round 4 §E) — the dashboard "How is your
 * experience?" band.
 *
 * A client island that lets the recruiter rate the placement portal 1–5 stars
 * with an optional comment. It holds NO domain knowledge and imports NO store or
 * server-only lib: it receives the recruiter's current rating as plain
 * serializable props and the server action injected as `action` (mirrors
 * `InterviewerPicker`). Persistence is a `<form action={action}>` with hidden
 * inputs — the `StarRating` atom's `name="stars"` hidden input carries the
 * numeric value, so there is no client-state plumbing back to the server.
 *
 * When a rating already exists it renders read-only (the stars + comment) with
 * an "Edit rating" affordance that swaps in the interactive form. A fresh
 * recruiter sees the form straight away. Recruiter-on-the-process feedback only —
 * never a judgement of a student.
 *
 * Styled with design tokens only.
 */

export interface ExperienceWidgetProps {
  /** The session recruiter id (server-resolved). Carried in a hidden input so
   *  the action keys the rating without trusting client-supplied identity —
   *  the action re-reads the session and ignores this, but it keeps the form
   *  self-describing. */
  readonly recruiterId: string;
  /** The recruiter's existing star rating (1–5), or null if not yet rated. */
  readonly currentStars: number | null;
  /** The recruiter's existing comment, if any. */
  readonly currentComment?: string;
  /** When the existing rating was left (display only). */
  readonly ratedAt?: string;
  readonly action: (formData: FormData) => void | Promise<void>;
}

export function ExperienceWidget({
  recruiterId,
  currentStars,
  currentComment,
  ratedAt,
  action,
}: ExperienceWidgetProps) {
  const hasRating = currentStars !== null;
  // Start in read-only mode when a rating exists; the recruiter taps "Edit" to
  // re-open the form. A fresh recruiter goes straight to the editable form.
  const [editing, setEditing] = useState(!hasRating);

  if (hasRating && !editing) {
    return (
      <div style={cardStyle}>
        <div style={summaryRowStyle}>
          <div style={{ display: 'grid', gap: 'var(--space-1)' }}>
            <StarRating
              value={currentStars}
              readOnly
              size={22}
              label="Your portal experience rating"
            />
            {ratedAt && <span style={metaStyle}>Rated {formatDate(ratedAt)}</span>}
          </div>
          <button type="button" onClick={() => setEditing(true)} style={editButtonStyle}>
            Edit rating
          </button>
        </div>
        {currentComment && <p style={commentReadStyle}>“{currentComment}”</p>}
      </div>
    );
  }

  return (
    <form action={action} style={cardStyle}>
      <input type="hidden" name="recruiterId" value={recruiterId} />

      <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
        <span style={fieldLabelStyle}>How would you rate the portal?</span>
        <StarRating
          name="stars"
          defaultValue={currentStars ?? 0}
          size={28}
          label="Rate your experience with the placement portal"
        />
      </div>

      <label style={{ display: 'grid', gap: 'var(--space-2)' }}>
        <span style={fieldLabelStyle}>Anything we could improve? (optional)</span>
        <textarea
          name="comment"
          defaultValue={currentComment ?? ''}
          rows={3}
          maxLength={500}
          placeholder="Tell us what worked and what didn't — this is feedback on the portal, not on any student."
          style={textareaStyle}
        />
      </label>

      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
        <Button type="submit" size="sm">
          {hasRating ? 'Update rating' : 'Submit rating'}
        </Button>
        {hasRating && (
          <button type="button" onClick={() => setEditing(false)} style={cancelButtonStyle}>
            Cancel
          </button>
        )}
        <span style={metaStyle}>Feedback on the portal — never about a student.</span>
      </div>
    </form>
  );
}

/** "12 May 2026" — a compact, unambiguous date for the read-only summary. */
function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const cardStyle: CSSProperties = {
  display: 'grid',
  gap: 'var(--space-5)',
  maxWidth: '560px',
  backgroundColor: 'var(--surface-card)',
  border: '1px solid var(--card-border)',
  borderRadius: 'var(--card-radius)',
  padding: 'var(--card-padding)',
};

const summaryRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 'var(--space-4)',
  flexWrap: 'wrap',
};

const fieldLabelStyle: CSSProperties = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};

const textareaStyle: CSSProperties = {
  width: '100%',
  padding: 'var(--space-3) var(--space-4)',
  fontSize: 'var(--fs-14)',
  lineHeight: 'var(--lh-23)',
  color: 'var(--text-strong)',
  backgroundColor: 'var(--surface-panel)',
  border: '1px solid var(--border-emphasized)',
  borderRadius: 'var(--radius-2)',
  resize: 'vertical',
  fontFamily: 'inherit',
};

const editButtonStyle: CSSProperties = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--accent)',
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  textDecoration: 'underline',
};

const cancelButtonStyle: CSSProperties = {
  fontSize: 'var(--fs-14)',
  fontWeight: 'var(--fw-500)',
  color: 'var(--text-secondary)',
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
};

const metaStyle: CSSProperties = {
  fontSize: 'var(--fs-12)',
  color: 'var(--text-secondary)',
};

const commentReadStyle: CSSProperties = {
  fontSize: 'var(--fs-14)',
  lineHeight: 'var(--lh-23)',
  fontWeight: 'var(--fw-300)',
  color: 'var(--text-primary)',
  margin: 0,
  fontStyle: 'italic',
};
