'use client';

import { useRouter } from 'next/navigation';
import { useState, type CSSProperties } from 'react';
import { Button, Overlay } from '@nid/ui';

/**
 * CloseJdPanel — the "close / withdraw this JD" form, presented in an Overlay
 * drawer (Round 4 §A — detail/secondary flows open inline, never navigate).
 *
 * Opened when the workspace page is hit with `?panel=close`. Closing the overlay
 * (Esc, backdrop, ✕, or Cancel) routes back to the workspace WITHOUT the param
 * via `router.push` — staying on the Offers tab.
 *
 * Client/server boundary: the close + withdraw server actions are injected as
 * props (they live in `jds/[jdId]/close/actions.ts`, kept in place); this island
 * never imports a store or server lib. The forms post directly to them.
 *
 * The withdraw categories are inlined (plain data) to match the legacy close
 * page's options.
 */

const WITHDRAW_CATEGORIES = [
  { value: 'force-majeure', label: 'Force majeure / Act of God' },
  { value: 'material-business-change', label: 'Material business change (layoff, role frozen)' },
  { value: 'other', label: 'Other' },
] as const;

export interface CloseJdPanelProps {
  readonly jdId: string;
  readonly jdTitle: string;
  /** True when the JD is still published (the only state the forms apply to). */
  readonly isPublished: boolean;
  readonly acceptedCount: number;
  readonly notSelectedCount: number;
  /** Current non-published status text, when not published (for the read-only note). */
  readonly statusLabel?: string;
  readonly closeJdAction: (formData: FormData) => void | Promise<void>;
  readonly withdrawJdAction: (formData: FormData) => void | Promise<void>;
}

export function CloseJdPanel({
  jdId,
  jdTitle,
  isPublished,
  acceptedCount,
  notSelectedCount,
  statusLabel,
  closeJdAction,
  withdrawJdAction,
}: CloseJdPanelProps) {
  const router = useRouter();
  // Open immediately (the page only renders this when ?panel=close is present).
  const [open, setOpen] = useState(true);

  const close = (): void => {
    setOpen(false);
    router.push(`/recruiter/offers?jd=${encodeURIComponent(jdId)}`);
  };

  return (
    <Overlay open={open} onClose={close} title={`Close “${jdTitle}”`} width="640px">
      {!isPublished ? (
        <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-strong)' }}>
          This JD is <strong>{statusLabel ?? 'no longer published'}</strong>. No further closure action is available.
        </p>
      ) : (
        <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
          <form action={closeJdAction} style={card}>
            <input type="hidden" name="jdId" value={jdId} />
            <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-strong)', marginBottom: 'var(--space-3)' }}>
              Selected: <strong>{acceptedCount}</strong> · Not selected: <strong>{notSelectedCount}</strong>
            </p>
            <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)', lineHeight: 1.5 }}>
              Required: a collective message for the not-selected students. NID holds recruiters to a respectful,
              specific closure note — explain the selection rationale without singling anyone out.
            </p>
            <textarea
              name="collectiveMessage"
              required
              rows={4}
              style={textarea}
              defaultValue="We prioritised candidates whose portfolios centred on systems-level product work. Thank you for the time and care you put into your application."
            />
            <div style={{ marginTop: 'var(--space-3)' }}>
              <Button type="submit">Send closure note &amp; close JD</Button>
            </div>
          </form>

          <form action={withdrawJdAction} style={{ ...card, borderColor: 'var(--pill-danger-fg, #b00)' }}>
            <input type="hidden" name="jdId" value={jdId} />
            <h3 style={{ ...label, marginBottom: 'var(--space-2)' }}>Or withdraw the JD (commitment break)</h3>
            <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)', lineHeight: 1.5 }}>
              Withdrawing a published JD is treated as a commitment break and carries a health-score signal unless you
              establish force majeure. Fees are non-refundable.
            </p>
            <label style={{ display: 'block', marginBottom: 'var(--space-2)' }}>
              <span style={fieldLabel}>Reason category</span>
              <select name="category" required style={input} defaultValue="">
                <option value="" disabled>
                  Select…
                </option>
                {WITHDRAW_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: 'block', marginBottom: 'var(--space-2)' }}>
              <span style={fieldLabel}>Detail (required)</span>
              <input name="reason" required placeholder="What happened?" style={input} />
            </label>
            <div style={{ marginTop: 'var(--space-2)' }}>
              <Button type="submit" variant="ghost" size="sm">
                Withdraw JD
              </Button>
            </div>
          </form>

          <div>
            <Button type="button" variant="ghost" size="sm" onClick={close}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Overlay>
  );
}

const label: CSSProperties = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};
const card: CSSProperties = {
  backgroundColor: 'var(--surface-card)',
  border: '1px solid var(--card-border)',
  borderRadius: 'var(--card-radius)',
  padding: 'var(--card-padding)',
};
const fieldLabel: CSSProperties = { fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' };
const input: CSSProperties = {
  width: '100%',
  marginTop: 'var(--space-1)',
  fontSize: 'var(--fs-14)',
  padding: 'var(--space-2) var(--space-3)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-2)',
  fontFamily: 'inherit',
};
const textarea: CSSProperties = { ...input, resize: 'vertical' };
