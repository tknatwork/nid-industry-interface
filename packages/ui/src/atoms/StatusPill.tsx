import type { ReactNode } from 'react';

/**
 * StatusPill — used everywhere a state appears: tracker statuses, JD lifecycle,
 * offer status, health-score bands. Reads only the status-pill component tokens.
 */

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export interface StatusPillProps {
  readonly tone?: StatusTone;
  readonly children: ReactNode;
  readonly leadingDot?: boolean;
}

const TONE_BG: Record<StatusTone, string> = {
  neutral: 'var(--pill-neutral-bg)',
  info: 'var(--pill-info-bg)',
  success: 'var(--pill-success-bg)',
  warning: 'var(--pill-warning-bg)',
  danger: 'var(--pill-danger-bg)',
};

const TONE_FG: Record<StatusTone, string> = {
  neutral: 'var(--pill-neutral-fg)',
  info: 'var(--pill-info-fg)',
  success: 'var(--pill-success-fg)',
  warning: 'var(--pill-warning-fg)',
  danger: 'var(--pill-danger-fg)',
};

export function StatusPill({ tone = 'neutral', children, leadingDot = true }: StatusPillProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        backgroundColor: TONE_BG[tone],
        color: TONE_FG[tone],
        padding: 'var(--pill-padding-y) var(--pill-padding-x)',
        borderRadius: 'var(--pill-radius)',
        fontSize: 'var(--pill-font-size)',
        fontWeight: 'var(--pill-font-weight)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
    >
      {leadingDot && (
        <span
          aria-hidden
          style={{
            display: 'inline-block',
            width: '6px',
            height: '6px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'currentColor',
          }}
        />
      )}
      {children}
    </span>
  );
}
