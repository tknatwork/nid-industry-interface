/**
 * Public lightweight feed (Phase 3.6) -- past recruiters from the last 5 years,
 * no auth. The legacy "Major Recruiters" wall is 54 hand-uploaded PNGs; this is
 * the structured, admin-curated equivalent the redesign exposes as a feed.
 */

import { PAST_RECRUITERS } from '~/lib/recruiter-public';

export function GET(): Response {
  // "Today" for the demo is 2026; show the trailing 5 years inclusive.
  const cutoff = 2026 - 5 + 1; // 2022
  const recruiters = PAST_RECRUITERS.filter((r) => r.year >= cutoff);
  return Response.json(
    { recruiters },
    {
      headers: {
        'Cache-Control': 'public, max-age=3600',
        'Content-Type': 'application/json; charset=utf-8',
      },
    },
  );
}
