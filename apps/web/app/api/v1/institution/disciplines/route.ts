/**
 * Institution-side read endpoint (Phase 3.6) -- the design-discipline taxonomy,
 * scoped by a per-campus `x-api-key`. Consuming campuses map their own role
 * vocabulary against this list.
 */

import { DISCIPLINES } from '~/lib/public-content';
import { institutionCampus, jsonResponse, unauthorized } from '~/lib/federation';

export function GET(req: Request): Response {
  const campus = institutionCampus(req);
  if (!campus) return unauthorized('institution API key required');
  return jsonResponse({ campus, disciplines: DISCIPLINES });
}
