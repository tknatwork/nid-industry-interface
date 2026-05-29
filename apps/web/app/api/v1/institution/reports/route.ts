/**
 * Institution-side read endpoint (Phase 3.6) -- aggregate placement reports,
 * scoped by a per-campus `x-api-key`. Counts and ranges only; no student PII.
 */

import { REPORTS } from '~/lib/recruiter-public';
import { institutionCampus, jsonResponse, unauthorized } from '~/lib/federation';

export function GET(req: Request): Response {
  const campus = institutionCampus(req);
  if (!campus) return unauthorized('institution API key required');
  return jsonResponse({ campus, reports: REPORTS });
}
