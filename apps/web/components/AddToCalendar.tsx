'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';

/**
 * AddToCalendar — a small per-activity control that turns one cycle activity's
 * `{ start, end }` span into three subscribe paths: a Google Calendar template
 * URL, an Outlook (Office 365) template URL, and a downloadable `.ics` file
 * generated client-side from a Blob.
 *
 * The span endpoints arrive as the same human-readable display strings the rest
 * of the Timeline renders ('14 Apr 2026'), so this component parses them into
 * all-day calendar dates. Calendar all-day events use an *exclusive* end date,
 * so the visible end day is bumped by one day for DTEND / Google's `dates` range.
 *
 * Pure presentation over static demo data — no store, no network. Styled only
 * with design tokens. Client component: it builds Blob object URLs and manages
 * a small popover open/close state.
 */

export interface AddToCalendarProps {
  /** Event title, e.g. 'NID Spring 2026 · Interview window'. */
  readonly title: string;
  /** Inclusive span start as a display string, e.g. '01 Jun 2026'. */
  readonly start: string;
  /** Inclusive span end as a display string, e.g. '05 Jun 2026'. */
  readonly end: string;
  /** Optional longer text dropped into the calendar event description/body. */
  readonly details?: string;
  /** Optional location line for the calendar event. */
  readonly location?: string;
}

const MONTHS: Readonly<Record<string, number>> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/** Parse '14 Apr 2026' → a UTC Date at midnight. Returns null if unparseable. */
function parseDisplayDate(value: string): Date | null {
  const m = value.trim().match(/^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = MONTHS[m[2]!.slice(0, 3).toLowerCase()];
  const year = Number(m[3]);
  if (month === undefined || Number.isNaN(day) || Number.isNaN(year)) return null;
  return new Date(Date.UTC(year, month, day));
}

/** A Date → 'YYYYMMDD' (all-day calendar date form). */
function toBasicDate(d: Date): string {
  const y = d.getUTCFullYear().toString().padStart(4, '0');
  const mo = (d.getUTCMonth() + 1).toString().padStart(2, '0');
  const da = d.getUTCDate().toString().padStart(2, '0');
  return `${y}${mo}${da}`;
}

/** All-day events use an exclusive end; bump the inclusive end day by one. */
function exclusiveEnd(d: Date): Date {
  return new Date(d.getTime() + 24 * 60 * 60 * 1000);
}

/** RFC 5545 TEXT escaping — mirrors apps/web/app/api/public/cycles.ics. */
function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** A stable-ish UID from the title — no randomness so SSR/CSR stay aligned. */
function slugForUid(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'event';
}

function buildIcs(props: AddToCalendarProps, startBasic: string, endExclBasic: string): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NID Industry Interface//Add To Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${slugForUid(props.title)}@industryinterface.nid.edu`,
    'DTSTAMP:20260101T000000Z',
    `DTSTART;VALUE=DATE:${startBasic}`,
    `DTEND;VALUE=DATE:${endExclBasic}`,
    `SUMMARY:${escapeIcsText(props.title)}`,
    ...(props.details ? [`DESCRIPTION:${escapeIcsText(props.details)}`] : []),
    ...(props.location ? [`LOCATION:${escapeIcsText(props.location)}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  // RFC 5545 mandates CRLF line breaks.
  return lines.join('\r\n') + '\r\n';
}

const wrapStyle: CSSProperties = { position: 'relative', display: 'inline-block' };

const triggerStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'var(--space-1)',
  padding: 'var(--space-1) var(--space-2)',
  fontFamily: 'var(--ff-sans)',
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--accent)',
  background: 'transparent',
  border: '1px solid var(--card-border)',
  borderRadius: 'var(--radius-pill)',
  cursor: 'pointer',
  transition: 'background-color var(--motion-micro), border-color var(--motion-micro)',
};

const menuStyle: CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + var(--space-1))',
  right: 0,
  zIndex: 20,
  minWidth: '180px',
  display: 'flex',
  flexDirection: 'column',
  padding: 'var(--space-1)',
  backgroundColor: 'var(--surface-card)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-2)',
  boxShadow: 'var(--shadow-3)',
};

const itemStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  padding: 'var(--space-2) var(--space-3)',
  fontFamily: 'var(--ff-sans)',
  fontSize: 'var(--fs-14)',
  fontWeight: 'var(--fw-500)',
  textAlign: 'left',
  color: 'var(--text-primary)',
  textDecoration: 'none',
  background: 'transparent',
  border: 'none',
  borderRadius: 'var(--radius-1)',
  cursor: 'pointer',
};

export function AddToCalendar({ title, start, end, details, location }: AddToCalendarProps) {
  const [open, setOpen] = useState(false);
  const [icsHref, setIcsHref] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const startDate = parseDisplayDate(start);
  const endDate = parseDisplayDate(end);
  // All-day calendar dates as stable primitive strings (effect-dep friendly).
  const startBasic = startDate ? toBasicDate(startDate) : null;
  const endExclBasic = endDate ? toBasicDate(exclusiveEnd(endDate)) : null;
  const filename = `${slugForUid(title)}.ics`;

  // Build (and revoke) the .ics Blob URL lazily — only while the menu is open.
  useEffect(() => {
    if (!open || !startBasic || !endExclBasic) return;
    const body = buildIcs(
      { title, start, end, ...(details ? { details } : {}), ...(location ? { location } : {}) },
      startBasic,
      endExclBasic,
    );
    const url = URL.createObjectURL(new Blob([body], { type: 'text/calendar' }));
    setIcsHref(url);
    return () => {
      URL.revokeObjectURL(url);
      setIcsHref(null);
    };
  }, [open, title, start, end, details, location, startBasic, endExclBasic]);

  // Close on outside click / Esc.
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = useCallback(() => setOpen((v) => !v), []);

  // Unparseable span: render nothing rather than a broken control.
  if (!startDate || !endDate || !startBasic || !endExclBasic) return null;

  // Google all-day range: YYYYMMDD/YYYYMMDD (end exclusive).
  const googleParams = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startBasic}/${endExclBasic}`,
  });
  if (details) googleParams.set('details', details);
  if (location) googleParams.set('location', location);
  const googleUrl = `https://calendar.google.com/calendar/render?${googleParams.toString()}`;

  // Outlook (Office 365) deeplink — ISO date with allday flag.
  const isoStart = `${startDate.getUTCFullYear()}-${(startDate.getUTCMonth() + 1).toString().padStart(2, '0')}-${startDate.getUTCDate().toString().padStart(2, '0')}`;
  const exEnd = exclusiveEnd(endDate);
  const isoEnd = `${exEnd.getUTCFullYear()}-${(exEnd.getUTCMonth() + 1).toString().padStart(2, '0')}-${exEnd.getUTCDate().toString().padStart(2, '0')}`;
  const outlookParams = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    allday: 'true',
    startdt: isoStart,
    enddt: isoEnd,
    subject: title,
  });
  if (details) outlookParams.set('body', details);
  if (location) outlookParams.set('location', location);
  const outlookUrl = `https://outlook.office.com/calendar/0/deeplink/compose?${outlookParams.toString()}`;

  return (
    <div ref={wrapRef} style={wrapStyle}>
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        style={triggerStyle}
      >
        <span aria-hidden>{'＋'}</span>
        Add to calendar
      </button>
      {open && (
        <div role="menu" style={menuStyle}>
          <a role="menuitem" href={googleUrl} target="_blank" rel="noopener noreferrer" style={itemStyle} onClick={() => setOpen(false)}>
            Google Calendar
          </a>
          <a role="menuitem" href={outlookUrl} target="_blank" rel="noopener noreferrer" style={itemStyle} onClick={() => setOpen(false)}>
            Outlook
          </a>
          {icsHref && (
            <a role="menuitem" href={icsHref} download={filename} style={itemStyle} onClick={() => setOpen(false)}>
              Download .ics
            </a>
          )}
        </div>
      )}
    </div>
  );
}
