'use client';

import { useState, type CSSProperties } from 'react';
import { Button, Overlay } from '@nid/ui';

/**
 * AcademicCalendarOverlay — a CTA that opens nid.edu's academic calendar inside
 * the shared `Overlay`, embedded via an `<iframe>` for a fast in-page
 * look-through without leaving the Timeline (plan §D).
 *
 * Framing caveat: nid.edu may send `X-Frame-Options` / a frame-ancestors CSP
 * that blocks embedding. We cannot detect that cross-origin from script, so the
 * overlay always carries a visible "Open in a new tab" fallback — the documented
 * escape hatch the plan calls for.
 *
 * Client component: holds the open/close state and renders the interactive
 * `Overlay`. Styled only with design tokens.
 */

/**
 * Source URL for the embedded academic calendar. In production this is an
 * admin-managed config value; for the demo it points at nid.edu's public
 * academic-calendar page.
 */
const ACADEMIC_CALENDAR_URL = 'https://www.nid.edu/admissions/academic-calendar';

export interface AcademicCalendarOverlayProps {
  /** Override the CTA label. Defaults to "View academic calendar". */
  readonly label?: string;
  /** Visual weight of the trigger button. Defaults to a quiet ghost. */
  readonly variant?: 'secondary' | 'ghost';
}

const noteStyle: CSSProperties = {
  margin: '0 0 var(--space-3)',
  fontSize: 'var(--fs-12)',
  color: 'var(--text-secondary)',
  lineHeight: 1.5,
};

const frameWrapStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
  height: 'min(70vh, 640px)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-2)',
  overflow: 'hidden',
  backgroundColor: 'var(--surface-panel)',
};

const frameStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  height: '100%',
  border: 'none',
};

const fallbackRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: 'var(--space-3)',
  marginTop: 'var(--space-4)',
};

export function AcademicCalendarOverlay({
  label = 'View academic calendar',
  variant = 'ghost',
}: AcademicCalendarOverlayProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant={variant} size="md" onClick={() => setOpen(true)}>
        {label}
      </Button>

      <Overlay open={open} onClose={() => setOpen(false)} title="NID academic calendar" width="960px">
        <p style={noteStyle}>
          Embedded from nid.edu for a quick look. If it does not load below, NID may block framing —
          use the new-tab link instead.
        </p>

        <div style={frameWrapStyle}>
          <iframe
            src={ACADEMIC_CALENDAR_URL}
            title="NID academic calendar"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            sandbox="allow-scripts allow-same-origin allow-popups"
            style={frameStyle}
          />
        </div>

        <div style={fallbackRowStyle}>
          <span style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' }}>
            Hosted on nid.edu
          </span>
          <a href={ACADEMIC_CALENDAR_URL} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <Button type="button" variant="secondary" size="sm" trailingIcon={<span aria-hidden>{'↗'}</span>}>
              Open in a new tab
            </Button>
          </a>
        </div>
      </Overlay>
    </>
  );
}
