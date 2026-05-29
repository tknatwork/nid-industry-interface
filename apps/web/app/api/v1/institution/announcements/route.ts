/**
 * Institution-side WRITE endpoint (Phase 2 federation surface) -- accepts a
 * campus announcement over a per-campus `x-api-key`. This demonstrates the
 * write side of the federation contract (auth gate + Zod validation + echo);
 * persistence is intentionally out of scope for the demo.
 */

import { z } from 'zod';
import { institutionCampus, jsonResponse, unauthorized } from '~/lib/federation';

const announcementSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
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

  const parsed = announcementSchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      { error: 'invalid announcement', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // No persistence -- echo the accepted write so the surface is demonstrable.
  const id = `ann_${Date.now().toString(36)}`;
  return jsonResponse(
    { ok: true, id, campus, receivedAt: new Date().toISOString() },
    { status: 201 },
  );
}
