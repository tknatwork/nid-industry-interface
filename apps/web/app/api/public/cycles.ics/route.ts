/**
 * Public lightweight feed (Phase 3.6) -- recruitment cycles as an iCalendar
 * (text/calendar) feed, no auth. One all-day VEVENT per cycle; the human-edited
 * milestone dates (apply opens, JD deadline, interview window, offer-by) ride
 * along in the event description. Minimal but valid -- a demo subscribe target.
 */

import { CYCLES, type Cycle } from '~/lib/public-content';

/** RFC 5545 TEXT escaping: backslash, semicolon, comma, and newlines. */
function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * A plausible all-day DTSTART (YYYYMMDD) for a cycle. We anchor on the season
 * in the slug rather than parsing the display strings -- this is a demo feed,
 * the milestone detail lives in the description.
 */
function allDayStart(cycle: Cycle): string {
  const year = cycle.slug.match(/(\d{4})/)?.[1] ?? '2026';
  const month = cycle.slug.startsWith('spring') ? '04' : '09';
  return `${year}${month}01`;
}

function buildEvent(cycle: Cycle): readonly string[] {
  const dtstart = allDayStart(cycle);
  const description = [
    `Status: ${cycle.status}`,
    `Fee: Rs ${cycle.feeRupees}`,
    `Applications open: ${cycle.applyOpens}`,
    `JD deadline: ${cycle.jdDeadline}`,
    `Browse opens: ${cycle.browseOpens}`,
    `Interview window: ${cycle.interviewWindow}`,
    `Offers by: ${cycle.offerBy}`,
  ].join('\n');

  return [
    'BEGIN:VEVENT',
    `UID:${cycle.slug}@industryinterface.nid.edu`,
    'DTSTAMP:20260101T000000Z',
    `DTSTART;VALUE=DATE:${dtstart}`,
    `SUMMARY:${escapeIcsText(`NID Industry Interface — ${cycle.label}`)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    'END:VEVENT',
  ];
}

export function GET(): Response {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NID Industry Interface//Cycles Feed//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:NID Industry Interface Cycles',
    ...CYCLES.flatMap(buildEvent),
    'END:VCALENDAR',
  ];

  // RFC 5545 mandates CRLF line breaks.
  const body = lines.join('\r\n') + '\r\n';

  return new Response(body, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="nid-cycles.ics"',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
