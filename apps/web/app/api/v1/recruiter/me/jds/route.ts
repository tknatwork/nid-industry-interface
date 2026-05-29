/**
 * Recruiter-side read endpoint (Phase 3.6) -- JD summaries for the authenticated
 * recruiter, scoped to their own recruiterId. Bearer-scoped, READ-ONLY.
 *
 * HARD GUARDRAIL (plan Phase 3.6 / 6.8): the recruiter API exposes counts and
 * aggregates only. We project each JD down to id/title/status/positions and
 * deliberately drop everything applicant- or student-shaped. No PII crosses
 * this boundary.
 */

import { listForRecruiter, type JdRecord } from '@nid/module-jd-posting';
import { recruiterFromBearer, jsonResponse, unauthorized } from '~/lib/federation';

export const dynamic = 'force-dynamic';

interface JdSummary {
  readonly id: string;
  readonly title: string;
  readonly status: JdRecord['status'];
  readonly positions: number;
}

export function GET(req: Request): Response {
  const r = recruiterFromBearer(req);
  if (!r) return unauthorized('valid recruiter bearer token required');

  const jds: readonly JdSummary[] = listForRecruiter(r.recruiterId).map((jd) => ({
    id: jd.id,
    title: jd.title,
    status: jd.status,
    positions: jd.positions,
  }));

  return jsonResponse({ recruiterId: r.recruiterId, jds });
}
