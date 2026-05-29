/**
 * Public lightweight feed (Phase 3.6) -- recruitment cycles as JSON, no auth.
 * Mirrors the hand-edited cycle dates on the legacy login page, but as a
 * machine-readable feed the bachelor-only campuses can consume.
 */

import { CYCLES } from '~/lib/public-content';

export function GET(): Response {
  return Response.json(
    { cycles: CYCLES },
    {
      headers: {
        'Cache-Control': 'public, max-age=3600',
        'Content-Type': 'application/json; charset=utf-8',
      },
    },
  );
}
