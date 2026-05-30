'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { minutesToDeadline } from '@nid/core';

/**
 * DeadlineCountdown — live countdown to a wave's acceptance deadline (Round 4 §D).
 *
 * Ticks once a minute via `minutesToDeadline` from `@nid/core` — a PURE function
 * (no store, no server import), so importing it into this client island is
 * allowed. The deadline itself arrives as a plain ISO string prop from the
 * Server Component; this island only renders the remaining time.
 *
 * At <= 0 it shows "deadline passed — refresh to float next": the auto-float is
 * lazy (evaluated server-side on the next load/action), so the copy nudges the
 * recruiter to refresh (or use the sweep / simulate controls) rather than
 * implying a background scheduler.
 */

export interface DeadlineCountdownProps {
  /** Wave acceptance deadline as an ISO timestamp. */
  readonly deadlineIso: string;
}

function formatRemaining(minutes: number): string {
  if (minutes <= 0) return '0m';
  const days = Math.floor(minutes / (60 * 24));
  const hours = Math.floor((minutes % (60 * 24)) / 60);
  const mins = minutes % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  // Always show minutes unless we already have days+hours and mins is 0.
  if (mins > 0 || parts.length === 0) parts.push(`${mins}m`);
  return parts.join(' ');
}

export function DeadlineCountdown({ deadlineIso }: DeadlineCountdownProps) {
  // Seed from `null` so the first client render matches the server (which has no
  // clock); compute the real value after mount, then tick every minute.
  const [minutes, setMinutes] = useState<number | null>(null);

  useEffect(() => {
    const tick = (): void => setMinutes(minutesToDeadline(deadlineIso, new Date()));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [deadlineIso]);

  if (minutes === null) {
    // Pre-hydration / first paint: neutral placeholder, no clock skew.
    return (
      <span style={chipStyle} aria-live="off">
        Response window open
      </span>
    );
  }

  if (minutes <= 0) {
    return (
      <span style={{ ...chipStyle, ...passedStyle }} role="status">
        Deadline passed — refresh to float next
      </span>
    );
  }

  return (
    <span style={chipStyle} role="timer" aria-live="polite">
      {formatRemaining(minutes)} left to respond
    </span>
  );
}

const chipStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'var(--space-1)',
  padding: 'var(--space-1) var(--space-2)',
  borderRadius: 'var(--radius-full)',
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  backgroundColor: 'var(--surface-panel)',
  color: 'var(--text-secondary)',
};

const passedStyle: CSSProperties = {
  backgroundColor: 'var(--pill-warning-bg)',
  color: 'var(--pill-warning-fg)',
};
