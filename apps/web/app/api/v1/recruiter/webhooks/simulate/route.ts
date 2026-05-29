/**
 * Recruiter-side webhook simulator (Phase 6.8) -- builds and signs a sample
 * delivery for a chosen event so a recruiter can see the exact signed-payload
 * shape (and exercise their verification code) without a live consumer.
 * Bearer-scoped. Nothing is delivered or persisted.
 */

import { z } from 'zod';
import { recruiterFromBearer, jsonResponse, unauthorized } from '~/lib/federation';
import { WEBHOOK_EVENTS, DEMO_WEBHOOK_SECRET, signWebhook } from '~/lib/webhooks';

export const dynamic = 'force-dynamic';

const simulateSchema = z.object({
  event: z.enum(WEBHOOK_EVENTS),
});

export async function POST(req: Request): Promise<Response> {
  const r = recruiterFromBearer(req);
  if (!r) return unauthorized('valid recruiter bearer token required');

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json({ error: 'request body must be valid JSON' }, { status: 400 });
  }

  const parsed = simulateSchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      { error: 'invalid webhook event', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const timestamp = Date.now().toString();
  const payload = {
    event: parsed.data.event,
    recruiterId: r.recruiterId,
    data: { note: 'sample payload' },
    timestamp,
  };
  const signatureHeader = signWebhook(DEMO_WEBHOOK_SECRET, timestamp, JSON.stringify(payload));

  return jsonResponse({
    payload,
    signatureHeader,
    verifyHint: 'X-NID-Signature header; verify with HMAC-SHA256 over `${t}.${rawBody}`',
  });
}
