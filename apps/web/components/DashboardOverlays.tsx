'use client';

import { useState, type CSSProperties } from 'react';
import { Overlay, Marquee, Button, StatusPill } from '@nid/ui';
import { DisciplineBrochure } from './DisciplineBrochure';

/**
 * DashboardOverlays — the client-only slices of the recruiter dashboard
 * (plan §K). The dashboard page itself stays a server component (it reads the
 * session, JD list, strike count, and resolves the cycle phase server-side);
 * everything here needs `onClick`/local state, so it is split out behind a
 * client boundary and composed back into the server page.
 *
 * Exports:
 *   - `DashboardBanner`    the full-width rolling deadline banner (Marquee).
 *   - `BrochureCTA`        a button that opens the tabbed `DisciplineBrochure`
 *                          (the Wave-1 component) inside an `Overlay` over the
 *                          dashboard — replaces the removed brochure gallery.
 *   - `StrikeTag`          the `0/3` verified-strike tag with an explainer
 *                          popover (reports are placement-cell-reviewed before
 *                          any strike is established).
 *   - `PingButton`         a demo "ping" affordance for a contact card.
 *
 * All presentation reads semantic tokens only; the data (deadline lines, strike
 * counts, contact details) is computed server-side and passed in as props.
 */

// ── Rolling deadline banner ──────────────────────────────────────────────────

export interface DashboardBannerProps {
  /** Pre-formatted, time-bound deadline lines (from CURRENT_CYCLES + GUIDELINES). */
  readonly lines: readonly string[];
}

/**
 * Full-width horizontal `Marquee` of the cycle's time-bound deadlines. Passed to
 * `RecruiterShell`'s `banner` prop. `Marquee` already degrades to a static strip
 * under `prefers-reduced-motion`, so reduced-motion users still read every line.
 */
export function DashboardBanner({ lines }: DashboardBannerProps) {
  if (lines.length === 0) return null;
  return (
    <div style={bannerWrapStyle}>
      <Marquee direction="horizontal" durationSeconds={42} label="Cycle deadlines">
        {lines.map((line) => (
          <span key={line} style={bannerItemStyle}>
            <span aria-hidden style={bannerDotStyle} />
            {line}
          </span>
        ))}
      </Marquee>
    </div>
  );
}

const bannerWrapStyle: CSSProperties = {
  maxWidth: '1280px',
  margin: '0 auto',
  paddingInline: 'var(--layout-page-x)',
  paddingBlock: 'var(--space-2)',
};

const bannerItemStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-primary)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  whiteSpace: 'nowrap',
};

const bannerDotStyle: CSSProperties = {
  display: 'inline-block',
  width: '6px',
  height: '6px',
  borderRadius: 'var(--radius-full)',
  backgroundColor: 'var(--accent)',
};

// ── Discipline brochures CTA + overlay ───────────────────────────────────────

/**
 * The "Discipline brochures" CTA. Opens the tabbed `DisciplineBrochure` inside a
 * wide `Overlay` over the dashboard — the recruiter never leaves the dashboard.
 * The brochure's own sticky tab bar provides the "jump into a specific
 * discipline" affordance the plan calls for.
 */
export function BrochureCTA() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div style={brochureCtaCardStyle}>
        <div style={{ flex: '1 1 320px' }}>
          <p style={kickerStyle}>Discipline brochures</p>
          <h2 style={brochureTitleStyle}>Explore all 20 NID design disciplines</h2>
          <p style={brochureLedeStyle}>
            One continuous brochure — what graduates of each discipline make, and the kind of work
            they ship. Jump straight to a discipline from the tab bar.
          </p>
        </div>
        <div style={{ flexShrink: 0 }}>
          <Button size="lg" onClick={() => setOpen(true)}>
            Open discipline brochures
          </Button>
        </div>
      </div>

      <Overlay
        open={open}
        onClose={() => setOpen(false)}
        title="Discipline brochures"
        width="min(1080px, 96vw)"
      >
        <DisciplineBrochure />
      </Overlay>
    </>
  );
}

const brochureCtaCardStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 'var(--space-6)',
  backgroundColor: 'var(--surface-card)',
  border: '1px solid var(--card-border)',
  borderRadius: 'var(--card-radius)',
  padding: 'var(--card-padding)',
};

const kickerStyle: CSSProperties = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 'var(--space-2)',
};

const brochureTitleStyle: CSSProperties = {
  fontSize: 'var(--fs-24)',
  lineHeight: 'var(--lh-30)',
  fontWeight: 'var(--fw-500)',
  color: 'var(--text-strong)',
  margin: 0,
};

const brochureLedeStyle: CSSProperties = {
  fontSize: 'var(--fs-14)',
  lineHeight: 'var(--lh-23)',
  fontWeight: 'var(--fw-300)',
  color: 'var(--text-primary)',
  marginTop: 'var(--space-2)',
  maxWidth: '560px',
};

// ── Verified-strike tag + explainer ──────────────────────────────────────────

export interface StrikeTagProps {
  /** Admin-upheld redressals against this recruiter. */
  readonly strikes: number;
  /** Blacklist trigger (3 in the demo). */
  readonly threshold: number;
}

/**
 * The `0/3` verified-strike tag with a click-to-reveal explainer: only
 * placement-cell-upheld student reports count as a strike — pending reports do
 * not. A `title` attribute mirrors the explainer for hover/AT, and the popover
 * makes it discoverable on touch.
 */
export function StrikeTag({ strikes, threshold }: StrikeTagProps) {
  const [open, setOpen] = useState(false);
  const tone = strikes === 0 ? 'success' : strikes >= threshold ? 'danger' : 'warning';
  const explainer =
    'Student reports are reviewed by the placement cell before any strike is established. ' +
    'Pending reports do not count — only an upheld redressal becomes a strike. ' +
    `${threshold} verified strikes trigger a blacklist review.`;

  return (
    <div style={strikeWrapStyle}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`Verified strikes: ${strikes} of ${threshold}. ${explainer}`}
        title={explainer}
        style={strikeButtonStyle}
      >
        <StatusPill tone={tone}>
          {strikes}/{threshold} strikes
        </StatusPill>
        <span aria-hidden style={strikeInfoGlyphStyle}>
          ⓘ
        </span>
      </button>

      {open && (
        <div role="note" style={strikePopoverStyle}>
          {explainer}
        </div>
      )}
    </div>
  );
}

const strikeWrapStyle: CSSProperties = {
  position: 'relative',
  display: 'inline-block',
};

const strikeButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  border: 'none',
  background: 'transparent',
  padding: 0,
  cursor: 'pointer',
  font: 'inherit',
};

const strikeInfoGlyphStyle: CSSProperties = {
  fontSize: 'var(--fs-14)',
  color: 'var(--text-secondary)',
  lineHeight: 1,
};

const strikePopoverStyle: CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + var(--space-2))',
  right: 0,
  zIndex: 20,
  width: 'min(320px, 80vw)',
  backgroundColor: 'var(--surface-card)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-3)',
  boxShadow: 'var(--shadow-2)',
  padding: 'var(--space-4)',
  fontSize: 'var(--fs-12)',
  lineHeight: 'var(--lh-18)',
  fontWeight: 'var(--fw-400)',
  color: 'var(--text-primary)',
  textTransform: 'none',
  letterSpacing: 'normal',
};

// ── Contact "ping" affordance ────────────────────────────────────────────────

export interface PingButtonProps {
  /** Who is being pinged — used in the demo acknowledgement copy. */
  readonly name: string;
  /** Their role — used in the demo acknowledgement copy. */
  readonly role: string;
}

/**
 * Demo "ping" affordance on a contact card. There is no real comms backend in
 * the prototype, so a press flips to a transient acknowledgement; the comms
 * layer lands in a later milestone.
 */
export function PingButton({ name, role }: PingButtonProps) {
  const [pinged, setPinged] = useState(false);

  if (pinged) {
    return (
      <span style={pingAckStyle} role="status">
        Ping sent to {name} (demo)
      </span>
    );
  }

  return (
    <Button size="sm" variant="secondary" onClick={() => setPinged(true)}>
      Ping {role}
    </Button>
  );
}

const pingAckStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--accent)',
};
