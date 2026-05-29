/**
 * Institution-side read endpoint (Phase 3.6) -- past recruiters, scoped by a
 * per-campus `x-api-key`. Supports `?years=N` (default 5) to widen/narrow the
 * trailing window.
 */

import { PAST_RECRUITERS } from '~/lib/recruiter-public';
import { institutionCampus, jsonResponse, unauthorized } from '~/lib/federation';

/** Demo "current" year -- the project date is 2026. */
const CURRENT_YEAR = 2026;

export function GET(req: Request): Response {
  const campus = institutionCampus(req);
  if (!campus) return unauthorized('institution API key required');

  const raw = new URL(req.url).searchParams.get('years');
  const parsed = raw === null ? 5 : Number.parseInt(raw, 10);
  const years = Number.isFinite(parsed) && parsed > 0 ? parsed : 5;

  const cutoff = CURRENT_YEAR - years + 1;
  const recruiters = PAST_RECRUITERS.filter((r) => r.year >= cutoff);

  return jsonResponse({ campus, years, recruiters });
}
