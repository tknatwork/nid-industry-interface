/**
 * Institution-side discipline taxonomy (Phase 3.6 read / Phase 2 write).
 *
 * GET returns the shared design-discipline taxonomy, scoped by a per-campus
 * `x-api-key`; consuming campuses map their own role vocabulary against it.
 *
 * PUT lets a campus register a campus-scoped description override for a single
 * discipline -- the shared taxonomy is never mutated, only annotated per campus.
 * This is the write side of the federation contract (auth gate + Zod validation
 * + echo); persistence is intentionally out of scope for the demo.
 */

import { z } from 'zod';
import { DISCIPLINES } from '~/lib/public-content';
import { institutionCampus, jsonResponse, unauthorized } from '~/lib/federation';

export const dynamic = 'force-dynamic';

export function GET(req: Request): Response {
  const campus = institutionCampus(req);
  if (!campus) return unauthorized('institution API key required');
  return jsonResponse({ campus, disciplines: DISCIPLINES });
}

const overrideSchema = z.object({
  slug: z.string().min(1),
  descriptionOverride: z.string().min(1),
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

  const parsed = overrideSchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      { error: 'invalid discipline override', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // No persistence -- echo the campus-scoped override so the surface is demonstrable.
  return jsonResponse({
    ok: true,
    campus,
    scope: 'campus-override',
    applied: {
      slug: parsed.data.slug,
      descriptionOverride: parsed.data.descriptionOverride,
    },
  });
}
