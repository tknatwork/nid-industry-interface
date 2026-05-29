/**
 * Federation API shared helpers (Phase 3.6 / 6.8 — API governance).
 *
 * Three audiences, three auth postures:
 *   - Institution-side: per-campus `x-api-key` (demo allowlist -> campus).
 *   - Recruiter-side: `Authorization: Bearer <keyId>` matched against the
 *     accountability module's issued keys -- READ-ONLY, never writes.
 *   - Public feeds: no auth at all.
 *
 * This is deliberately mock auth (allowlist + bearer-id match) for the demo --
 * no real crypto, no new libraries. Real STQC-cleared auth lands later.
 */

import { listApiKeys } from '@nid/module-admin-accountability';

/** Institution demo key allowlist -> campus. Per-campus key scoping (Phase 3.6). */
const INSTITUTION_KEYS: Readonly<Record<string, string>> = {
  'nid-inst-ahmedabad-demo': 'Ahmedabad',
  'nid-inst-bengaluru-demo': 'Bengaluru',
  'nid-inst-gandhinagar-demo': 'Gandhinagar',
};

/**
 * Resolve the campus an institution request is scoped to. Reads the
 * `x-api-key` header and maps it through the demo allowlist; returns null if
 * the header is absent or the key is unknown.
 */
export function institutionCampus(req: Request): string | null {
  const key = req.headers.get('x-api-key');
  if (!key) return null;
  return INSTITUTION_KEYS[key] ?? null;
}

export interface RecruiterIdentity {
  readonly recruiterId: string;
  readonly companyName: string;
}

/**
 * Resolve the recruiter behind a bearer token. Parses
 * `Authorization: Bearer <id>` and matches an ACTIVE key from listApiKeys() by
 * id; returns the key's recruiterId + companyName, or null when the header is
 * missing/malformed, the key is unknown, or the key has been revoked.
 */
export function recruiterFromBearer(req: Request): RecruiterIdentity | null {
  const header = req.headers.get('authorization');
  if (!header) return null;

  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  const keyId = match?.[1]?.trim();
  if (!keyId) return null;

  const key = listApiKeys().find((k) => k.id === keyId && k.status === 'active');
  if (!key) return null;

  return { recruiterId: key.recruiterId, companyName: key.companyName };
}

/**
 * Success JSON response with the federation cache + (mock) rate-limit headers.
 * Caller-supplied init is merged; explicit headers here win to keep the
 * governance contract stable.
 */
export function jsonResponse(data: unknown, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  headers.set('Cache-Control', 'private, max-age=60');
  headers.set('X-RateLimit-Limit', '1000');
  headers.set('X-RateLimit-Remaining', '999');
  return Response.json(data, { ...init, headers });
}

/** 401 with a machine-readable reason and a WWW-Authenticate challenge. */
export function unauthorized(reason: string): Response {
  return Response.json(
    { error: reason },
    {
      status: 401,
      headers: { 'WWW-Authenticate': 'Bearer realm="nid-federation"' },
    },
  );
}
