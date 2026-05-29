/**
 * Signed-webhook delivery helpers (Phase 6.8 — federation egress).
 *
 * Recruiters subscribe to placement-lifecycle events; we POST each event to
 * their endpoint with an `X-NID-Signature` header so they can verify the body
 * was untampered and originated here. The scheme mirrors the widely-used
 * Stripe-style `t=<ts>,v1=<hmac>` envelope, signing `${timestamp}.${rawBody}`
 * with HMAC-SHA256.
 *
 * Built on Node's `node:crypto` only — no new dependencies, no real key store.
 * In production each recruiter gets a distinct secret that rotates on demand;
 * here a single demo secret stands in.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * The catalogue of placement-lifecycle events a recruiter can subscribe to.
 * Ordering follows a cycle's lifecycle (open -> JD -> applicants -> shortlist
 * -> interview -> offer -> close).
 */
export const WEBHOOK_EVENTS = [
  'cycle.opened',
  'cycle.deadline.approaching',
  'application.status.changed',
  'jd.published',
  'jd.applicants.added',
  'shortlist.confirmed',
  'interview.scheduled',
  'offer.status.changed',
  'cycle.closed',
] as const;

/** A single event name from the subscribable catalogue. */
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

/**
 * Demo signing secret. MOCK ONLY — in production each recruiter is issued a
 * distinct `whsec_*` secret that rotates per recruiter on demand, never this
 * shared constant.
 */
export const DEMO_WEBHOOK_SECRET = 'whsec_demo_nid_industry';

/**
 * Sign a webhook delivery. Produces a `t=<timestamp>,v1=<hex>` header value
 * where the HMAC-SHA256 is computed over `${timestamp}.${body}` — binding the
 * signature to both the payload and the time it was issued (replay defence).
 */
export function signWebhook(secret: string, timestamp: string, body: string): string {
  const mac = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
  return `t=${timestamp},v1=${mac}`;
}

/**
 * Verify a webhook signature by recomputing it from the secret/timestamp/body
 * and comparing in constant time. Returns false on any length mismatch (which
 * `timingSafeEqual` would otherwise throw on) so a malformed signature is a
 * clean rejection, not an exception.
 */
export function verifyWebhook(
  secret: string,
  timestamp: string,
  body: string,
  signature: string,
): boolean {
  const expected = signWebhook(secret, timestamp, body);
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(signature);
  if (expectedBuf.length !== actualBuf.length) return false;
  return timingSafeEqual(expectedBuf, actualBuf);
}
