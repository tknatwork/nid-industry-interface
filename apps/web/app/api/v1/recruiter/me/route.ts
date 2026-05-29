/**
 * Recruiter-side read endpoint (Phase 3.6) -- the authenticated recruiter's own
 * identity + current health band. Bearer-scoped, READ-ONLY. Aggregates only;
 * never any student PII.
 */

import { recruiterScoreDetail } from '@nid/module-admin-accountability';
import { recruiterFromBearer, jsonResponse, unauthorized } from '~/lib/federation';

export const dynamic = 'force-dynamic';

export function GET(req: Request): Response {
  const r = recruiterFromBearer(req);
  if (!r) return unauthorized('valid recruiter bearer token required');

  const healthBand = recruiterScoreDetail(r.recruiterId)?.band;

  return jsonResponse({
    recruiterId: r.recruiterId,
    companyName: r.companyName,
    ...(healthBand !== undefined ? { healthBand } : {}),
  });
}
