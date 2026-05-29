/**
 * Recruiter-side read endpoint (Phase 3.6) -- recruitment cycles for the
 * authenticated recruiter. Bearer-scoped, READ-ONLY.
 */

import { CYCLES } from '~/lib/public-content';
import { recruiterFromBearer, jsonResponse, unauthorized } from '~/lib/federation';

export const dynamic = 'force-dynamic';

export function GET(req: Request): Response {
  const r = recruiterFromBearer(req);
  if (!r) return unauthorized('valid recruiter bearer token required');
  return jsonResponse({ recruiterId: r.recruiterId, cycles: CYCLES });
}
