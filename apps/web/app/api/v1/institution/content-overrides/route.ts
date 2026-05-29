/**
 * Institution-side WRITE endpoint (Phase 2 federation surface) -- accepts a
 * campus-scoped content override for a named slot (e.g. a localized banner or
 * page-section string) over a per-campus `x-api-key`. This demonstrates the
 * write side of the federation contract (auth gate + Zod validation + echo);
 * persistence is intentionally out of scope for the demo.
 */

import { z } from 'zod';
import { institutionCampus, jsonResponse, unauthorized } from '~/lib/federation';

export const dynamic = 'force-dynamic';

const contentOverrideSchema = z.object({
  slot: z.string().min(1),
  value: z.string().min(1),
});

export async function POST(req: Request): Promise<Response> {
  const campus = institutionCampus(req);
  if (!campus) return unauthorized('institution API key required');

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json({ error: 'request body must be valid JSON' }, { status: 400 });
  }

  const parsed = contentOverrideSchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      { error: 'invalid content override', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // No persistence -- echo the accepted override so the surface is demonstrable.
  return jsonResponse({
    ok: true,
    campus,
    slot: parsed.data.slot,
    receivedAt: new Date().toISOString(),
  });
}
