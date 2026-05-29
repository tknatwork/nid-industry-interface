/**
 * Institution-side read endpoint (Phase 3.6) -- recruitment cycles, scoped by a
 * per-campus `x-api-key`. The bachelor-only campuses build their own portals on
 * top of this surface.
 */

import { CYCLES } from '~/lib/public-content';
import { institutionCampus, jsonResponse, unauthorized } from '~/lib/federation';

export function GET(req: Request): Response {
  const campus = institutionCampus(req);
  if (!campus) return unauthorized('institution API key required');
  return jsonResponse({ campus, cycles: CYCLES });
}
