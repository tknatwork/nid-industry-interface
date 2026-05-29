/**
 * Recruiter-side webhook catalogue (Phase 6.8) -- the set of placement-lifecycle
 * events a recruiter can subscribe their endpoint to. Bearer-scoped, READ-ONLY.
 */

import { recruiterFromBearer, jsonResponse, unauthorized } from '~/lib/federation';
import { WEBHOOK_EVENTS } from '~/lib/webhooks';

export const dynamic = 'force-dynamic';

export async function GET(req: Request): Promise<Response> {
  const r = recruiterFromBearer(req);
  if (!r) return unauthorized('valid recruiter bearer token required');

  return jsonResponse({ events: WEBHOOK_EVENTS });
}
