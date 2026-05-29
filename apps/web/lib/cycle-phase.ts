/**
 * Cycle-phase helper (Round 2 §J).
 *
 * A PURE, I/O-free function that, given the open cycle's activity windows
 * (each a { start, end } date pair), works out where in the placement cycle
 * "today" falls: the currently active phase, the next upcoming deadline, and
 * how many days remain to it.
 *
 * The activity date *strings* used in `public-content.ts` come in two shapes:
 *   - a single milestone day:  "14 May 2026"
 *   - an inclusive range:      "1–5 Jun 2026"  (en-dash) or "1-5 Jun 2026"
 * In a range, the month + year appear only once (on the end), so the start day
 * inherits them. `parseActivityDates` turns either shape into a { start, end }
 * pair; callers pass the resulting pairs to `cyclePhase`.
 *
 * This file deliberately holds NO React and NO design tokens — it renders
 * nothing. The RecruiterShell phase tag / rolling banner consume its output
 * and own the presentation (tokens live there).
 *
 * Determinism: `today` is always injected by the caller (never read from the
 * system clock here) so the function stays pure and unit-testable. Production
 * callers pass `new Date()`; the demo/tests pass a fixed date (30 May 2026).
 */

/** One activity's inclusive window. `start === end` for a single-day milestone. */
export interface ActivityWindow {
  /** Local-midnight Date for the first day of the window. */
  readonly start: Date;
  /** Local-midnight Date for the last day of the window (inclusive). */
  readonly end: Date;
}

/**
 * An activity to evaluate: a stable phase key, a human label, and its window.
 * The caller supplies these (the function does not assume any particular
 * cycle's field names and sorts them chronologically itself).
 */
export interface CycleActivity extends ActivityWindow {
  /** Stable identifier for the phase, e.g. 'applications' | 'jd-upload'. */
  readonly key: string;
  /** Display label, e.g. 'Interview window'. */
  readonly label: string;
}

/** A deadline still ahead of `today`, with its whole-day countdown. */
export interface NextDeadline {
  readonly key: string;
  readonly label: string;
  /** The boundary date the countdown targets (an activity start or end). */
  readonly date: Date;
  /**
   * Whether `date` is the activity's opening (`start`) or closing (`end`).
   * Lets the UI phrase it as "opens" vs "closes/by".
   */
  readonly boundary: 'start' | 'end';
  /** Whole days from `today` (local midnights) to `date`. Always >= 0 here. */
  readonly daysRemaining: number;
}

/** The active phase: the activity whose window contains `today`, if any. */
export interface ActivePhase {
  readonly key: string;
  readonly label: string;
  readonly start: Date;
  readonly end: Date;
}

export interface CyclePhase {
  /**
   * The activity window containing `today`, or null when `today` sits in a gap
   * between windows (e.g. browsing has closed but interviews have not opened —
   * the "pre-interview" lull). When null, `nextDeadline` points at the next
   * window to open.
   */
  readonly activePhase: ActivePhase | null;
  /** The reference date the calculation was run against (local midnight). */
  readonly today: Date;
  /**
   * The soonest boundary strictly after `today`: the start of the next
   * not-yet-open activity, or the end of an in-progress one — whichever is
   * sooner. Null once every boundary is in the past (cycle fully elapsed).
   */
  readonly nextDeadline: NextDeadline | null;
  /**
   * Convenience mirror of `nextDeadline.daysRemaining`; null when there is no
   * next deadline. Whole days, never negative.
   */
  readonly daysRemaining: number | null;
}

const MS_PER_DAY = 86_400_000;

const MONTHS: Readonly<Record<string, number>> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

/** Single-milestone shape: "14 May 2026". */
const MILESTONE_RE = /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/;
/**
 * Range shape: "1–5 Jun 2026". The separator may be an en-dash (–), em-dash
 * (—), figure-dash (‒), or hyphen (-), optionally space-padded. Month + year
 * appear once and apply to both days.
 */
const RANGE_RE = /^(\d{1,2})\s*[‒–—-]\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/;

/**
 * Normalize any Date to local midnight. Phase boundaries are day-granular, so
 * we strip the time component before every comparison to avoid off-by-one
 * countdowns when `today` carries a wall-clock time.
 */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Whole days from `from` to `to`, both snapped to local midnight. */
export function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / MS_PER_DAY);
}

/** Look up a 0-based month index from a 3+ letter English month name. */
function monthIndex(token: string): number | null {
  const key = token.slice(0, 3).toLowerCase();
  return key in MONTHS ? (MONTHS[key] as number) : null;
}

function makeDay(day: number, month: number, year: number): Date | null {
  const d = new Date(year, month, day);
  // Reject impossible dates (e.g. 31 Feb rolls over) by round-tripping.
  if (d.getFullYear() !== year || d.getMonth() !== month || d.getDate() !== day) {
    return null;
  }
  return d;
}

/**
 * Parse a single milestone string like "14 May 2026" into a local-midnight
 * Date. Returns null when the shape is not recognized. Whitespace-tolerant.
 */
export function parseMilestoneDate(value: string): Date | null {
  const m = value.trim().match(MILESTONE_RE);
  if (m === null) return null;

  const day = Number(m[1]);
  const month = monthIndex(m[2] ?? '');
  const year = Number(m[3]);
  if (month === null || !Number.isInteger(day) || !Number.isInteger(year)) {
    return null;
  }
  return makeDay(day, month, year);
}

/**
 * Parse an activity date string into an inclusive { start, end } window.
 *
 * Accepts both a single milestone ("23 May 2026" → start === end) and an
 * inclusive range where the month + year are written once on the end
 * ("1–5 Jun 2026" or "1-5 Jun 2026" → 1 Jun .. 5 Jun). Returns null when the
 * string matches neither shape.
 *
 * This is the bridge from the `public-content.ts` strings to `cyclePhase`'s
 * structured input, kept exported so it can be unit-tested in isolation.
 */
export function parseActivityDates(value: string): ActivityWindow | null {
  const trimmed = value.trim();

  const range = trimmed.match(RANGE_RE);
  if (range !== null) {
    const startDay = Number(range[1]);
    const endDay = Number(range[2]);
    const month = monthIndex(range[3] ?? '');
    const year = Number(range[4]);
    if (month === null) return null;

    const start = makeDay(startDay, month, year);
    const end = makeDay(endDay, month, year);
    if (start === null || end === null) return null;
    // A backwards range ("5–1 Jun") is malformed.
    if (start.getTime() > end.getTime()) return null;
    return { start, end };
  }

  // Single-day form.
  const day = parseMilestoneDate(trimmed);
  if (day === null) return null;
  return { start: day, end: day };
}

/**
 * Core phase resolver. Given the cycle's activities (any order) and a reference
 * date, returns the active phase, the next upcoming deadline, and the day
 * countdown. Pure — no clock access, no I/O.
 *
 * "Active phase" = the (first, by start) activity whose inclusive window
 * contains `today`. When `today` is between two windows, `activePhase` is null
 * and `nextDeadline` is the next window's opening.
 *
 * "Next deadline" = the soonest activity boundary strictly after `today`: the
 * `end` of any in-progress activity, or the `start` of any not-yet-opened one,
 * whichever comes first. Ties resolve to the earlier-listed activity after a
 * stable chronological sort.
 */
export function cyclePhase(activities: readonly CycleActivity[], now: Date): CyclePhase {
  const today = startOfDay(now);
  const todayMs = today.getTime();

  const sorted = [...activities].sort((a, b) => {
    const byStart = a.start.getTime() - b.start.getTime();
    return byStart !== 0 ? byStart : a.end.getTime() - b.end.getTime();
  });

  const active = sorted.find(
    (a) => startOfDay(a.start).getTime() <= todayMs && todayMs <= startOfDay(a.end).getTime(),
  );

  // Build the candidate set of future boundaries, then keep the soonest.
  let next: NextDeadline | null = null;
  for (const a of sorted) {
    const startMs = startOfDay(a.start).getTime();
    const endMs = startOfDay(a.end).getTime();

    // A not-yet-open activity contributes its opening boundary.
    if (startMs > todayMs) {
      next = pickSooner(next, {
        key: a.key,
        label: a.label,
        date: a.start,
        boundary: 'start',
        daysRemaining: daysBetween(today, a.start),
      });
    }
    // An in-progress (or future-ending) activity contributes its closing
    // boundary. Skip when the window has already closed.
    if (endMs > todayMs) {
      next = pickSooner(next, {
        key: a.key,
        label: a.label,
        date: a.end,
        boundary: 'end',
        daysRemaining: daysBetween(today, a.end),
      });
    }
  }

  return {
    activePhase: active
      ? { key: active.key, label: active.label, start: active.start, end: active.end }
      : null,
    today,
    nextDeadline: next,
    daysRemaining: next ? next.daysRemaining : null,
  };
}

/** Keep whichever deadline lands sooner; the existing one wins ties (stable). */
function pickSooner(current: NextDeadline | null, candidate: NextDeadline): NextDeadline {
  if (current === null) return candidate;
  return candidate.date.getTime() < current.date.getTime() ? candidate : current;
}
