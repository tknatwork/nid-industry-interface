/**
 * Institution-side read endpoint (Phase 3.6) -- per-campus student coordinators
 * plus the shared escalation chain, scoped by a per-campus `x-api-key`.
 */

import { COORDINATORS, ESCALATION } from '~/lib/recruiter-public';
import { institutionCampus, jsonResponse, unauthorized } from '~/lib/federation';

export function GET(req: Request): Response {
  const campus = institutionCampus(req);
  if (!campus) return unauthorized('institution API key required');
  return jsonResponse({ campus, coordinators: COORDINATORS, escalation: ESCALATION });
}
