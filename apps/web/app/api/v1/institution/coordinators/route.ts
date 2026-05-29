/**
 * Institution-side student coordinators (Phase 3.6 read / Phase 2 write).
 *
 * GET returns this campus's student coordinators plus the shared escalation
 * chain, scoped by a per-campus `x-api-key`.
 *
 * PUT lets a campus push its own coordinator roster (each entry a name + the
 * company they liaise for). This is the write side of the federation contract
 * (auth gate + Zod validation + echo); persistence is out of scope for the demo.
 */

import { z } from 'zod';
import { COORDINATORS, ESCALATION } from '~/lib/recruiter-public';
import { institutionCampus, jsonResponse, unauthorized } from '~/lib/federation';

export const dynamic = 'force-dynamic';

export function GET(req: Request): Response {
  const campus = institutionCampus(req);
  if (!campus) return unauthorized('institution API key required');
  return jsonResponse({ campus, coordinators: COORDINATORS, escalation: ESCALATION });
}

const coordinatorsSchema = z.object({
  coordinators: z
    .array(
      z.object({
        name: z.string().min(1),
        company: z.string().min(1),
      }),
    )
    .min(1),
});

export async function PUT(req: Request): Promise<Response> {
  const campus = institutionCampus(req);
  if (!campus) return unauthorized('institution API key required');

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json({ error: 'request body must be valid JSON' }, { status: 400 });
  }

  const parsed = coordinatorsSchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      { error: 'invalid coordinators roster', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // No persistence -- echo the accepted count so the surface is demonstrable.
  return jsonResponse({ ok: true, campus, count: parsed.data.coordinators.length });
}
