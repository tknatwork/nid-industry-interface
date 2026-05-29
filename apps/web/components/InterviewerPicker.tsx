'use client';

import { useState, type CSSProperties } from 'react';
import { Button, StatusPill } from '@nid/ui';

/**
 * Per-candidate expected-interviewers picker (plan §P).
 *
 * Sits on the recruiter slots page. Once a candidate holds a slot, the recruiter
 * picks which of the company's named sub-roles (HR Director / Hiring Manager /
 * Interviewer — `~/lib/recruiter-subroles`) will run that interview. The chosen
 * interviewers are stored on the SlotAssignment via the `assignInterviewers`
 * action and surface again on the interview-day console / Before tab.
 *
 * A disclosure keeps the row compact: collapsed it shows the current expected
 * interviewers (or a prompt); expanded it shows a checkbox group + Save. Each
 * checkbox submits its sub-role id under the repeated `interviewers` field name,
 * which the server action reads with `formData.getAll('interviewers')`.
 *
 * Styled with design tokens only.
 */

export interface SubRoleOption {
  readonly id: string;
  /** Display label, e.g. "Priya Menon · HR Director". */
  readonly label: string;
  readonly title: string;
  readonly phone: string;
}

export interface InterviewerPickerProps {
  readonly jdId: string;
  readonly studentId: string;
  readonly candidateName: string;
  /** The full company roster to choose from. */
  readonly options: readonly SubRoleOption[];
  /** Sub-role ids currently assigned to this candidate's slot. */
  readonly selectedIds: readonly string[];
  /** True once the candidate holds a slot; the picker is disabled otherwise. */
  readonly hasSlot: boolean;
  readonly action: (formData: FormData) => void | Promise<void>;
}

export function InterviewerPicker({
  jdId,
  studentId,
  candidateName,
  options,
  selectedIds,
  hasSlot,
  action,
}: InterviewerPickerProps) {
  const [open, setOpen] = useState(false);

  const selectedSet = new Set(selectedIds);
  const selectedLabels = options.filter((o) => selectedSet.has(o.id)).map((o) => o.label);
  const groupId = `interviewers-${studentId}`;

  if (!hasSlot) {
    return (
      <p style={hint}>
        Assign a slot first to set expected interviewers.
      </p>
    );
  }

  if (options.length === 0) {
    return (
      <p style={hint}>
        No interviewers on your account yet. Add people under Settings.
      </p>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        <span style={fieldLabel}>Expected interviewers</span>
        {selectedLabels.length > 0 ? (
          <StatusPill tone="info">
            {selectedLabels.length} assigned
          </StatusPill>
        ) : (
          <span style={hint}>None set</span>
        )}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={groupId}
          style={disclosureButton}
        >
          {open ? 'Close' : selectedLabels.length > 0 ? 'Edit' : 'Set interviewers'}
        </button>
      </div>

      {/* Collapsed summary of who is currently expected. */}
      {!open && selectedLabels.length > 0 && (
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {selectedLabels.map((l) => (
            <span key={l} style={chip}>
              {l}
            </span>
          ))}
        </div>
      )}

      {open && (
        <form action={action} id={groupId} style={pickerCard}>
          <input type="hidden" name="jdId" value={jdId} />
          <input type="hidden" name="studentId" value={studentId} />
          <fieldset style={fieldset}>
            <legend style={legend}>Who will interview {candidateName}?</legend>
            <div style={{ display: 'grid', gap: 'var(--space-1)' }}>
              {options.map((o) => (
                <label key={o.id} style={checkRow}>
                  <input
                    type="checkbox"
                    name="interviewers"
                    value={o.id}
                    defaultChecked={selectedSet.has(o.id)}
                    style={{ accentColor: 'var(--accent)', width: '1rem', height: '1rem' }}
                  />
                  <span style={{ display: 'grid' }}>
                    <span style={{ fontSize: 'var(--fs-14)', color: 'var(--text-strong)', fontWeight: 'var(--fw-500)' }}>
                      {o.label}
                    </span>
                    <span style={hint}>{o.phone}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
            <Button type="submit" size="sm">
              Save interviewers
            </Button>
            <span style={hint}>Leave all unchecked to clear.</span>
          </div>
        </form>
      )}
    </div>
  );
}

const fieldLabel: CSSProperties = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};
const hint: CSSProperties = { fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' };
const disclosureButton: CSSProperties = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--accent)',
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  textDecoration: 'underline',
};
const chip: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: 'var(--space-1) var(--space-2)',
  borderRadius: 'var(--radius-full)',
  backgroundColor: 'var(--surface-panel)',
  color: 'var(--text-strong)',
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-500)',
};
const pickerCard: CSSProperties = {
  display: 'grid',
  gap: 'var(--space-3)',
  padding: 'var(--space-4)',
  backgroundColor: 'var(--surface-panel)',
  border: '1px solid var(--card-border)',
  borderRadius: 'var(--radius-2)',
};
const fieldset: CSSProperties = { border: 'none', margin: 0, padding: 0 };
const legend: CSSProperties = {
  fontSize: 'var(--fs-13)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-strong)',
  marginBottom: 'var(--space-2)',
  padding: 0,
};
const checkRow: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 'var(--space-2)',
  padding: 'var(--space-2)',
  borderRadius: 'var(--radius-2)',
  cursor: 'pointer',
};
