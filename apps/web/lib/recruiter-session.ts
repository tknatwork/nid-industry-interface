/**
 * Demo recruiter session — a thin cookie layer over {@link DEMO_RECRUITER}.
 *
 * The real II portal issues credentials only after the placement cell approves
 * a recruiter (plan §4.1); there is no self-serve signup. For the prototype we
 * fake exactly that one step: the login page (plan §H) validates prefilled demo
 * credentials, then this helper writes a session cookie so a "logged-in"
 * recruiter persists across requests. Everything downstream (the dashboard and
 * the rest of `/recruiter/*`, plan §I) reads the recruiter through
 * {@link readRecruiterSession} instead of importing `DEMO_RECRUITER` directly,
 * so when real auth lands only this file changes.
 *
 * Demo posture: the cookie is unsigned and carries only a recruiter id — no
 * secret, no real authentication. It is the moral equivalent of `DEMO_RECRUITER`
 * with a logout switch. Reads always resolve to a known recruiter, falling back
 * to {@link DEMO_RECRUITER} when the cookie is absent or unrecognised, so no
 * surface ever renders without a recruiter context.
 *
 * Server-only: uses `next/headers` `cookies()`. Import from Server Components,
 * Server Actions, or Route Handlers — never from a Client Component.
 */

import { cookies } from 'next/headers';
import { DEMO_RECRUITER } from './demo-recruiter';

/** Cookie name for the demo recruiter session. Namespaced to avoid collisions. */
export const RECRUITER_SESSION_COOKIE = 'nid_demo_recruiter';

/** One demo working day in seconds — long enough to click around, short enough to expire. */
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

/**
 * The resolved recruiter for the current request. Mirrors the shape of
 * {@link DEMO_RECRUITER} so callers can swap a direct import for a session read
 * with no other change.
 */
export interface RecruiterSession {
  readonly recruiterId: string;
  readonly companyName: string;
  readonly cycleId: string;
}

/**
 * The recruiters this demo can resolve a session to. Today only Acme Design
 * Studio is seeded (`credentials-issued`), so the cookie only ever stores its
 * id; the map exists so adding a second demo recruiter later is a one-line
 * change rather than a refactor of every reader.
 */
const KNOWN_RECRUITERS: Readonly<Record<string, RecruiterSession>> = {
  [DEMO_RECRUITER.recruiterId]: { ...DEMO_RECRUITER },
};

/**
 * Sets the demo session cookie to the given recruiter. Called from the login
 * server action after the prefilled demo credentials check passes.
 *
 * `httpOnly` so client JS can't read it, `sameSite: 'lax'` so a top-level
 * navigation (the post-login redirect) still carries it, and `secure` in
 * production only so it keeps working over plain http on localhost.
 */
export async function setRecruiterSession(recruiterId: string): Promise<void> {
  const store = await cookies();
  store.set(RECRUITER_SESSION_COOKIE, recruiterId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env['NODE_ENV'] === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/** Clears the demo session cookie (logout). */
export async function clearRecruiterSession(): Promise<void> {
  const store = await cookies();
  store.delete(RECRUITER_SESSION_COOKIE);
}

/** True when a recognised session cookie is present (i.e. the recruiter "logged in"). */
export async function hasRecruiterSession(): Promise<boolean> {
  const store = await cookies();
  const id = store.get(RECRUITER_SESSION_COOKIE)?.value;
  return id != null && id in KNOWN_RECRUITERS;
}

/**
 * Resolves the recruiter for the current request from the session cookie,
 * falling back to {@link DEMO_RECRUITER} when the cookie is missing or its value
 * isn't a recruiter this demo knows about. Never throws and never returns
 * `undefined` — the demo always has an acting recruiter.
 */
export async function readRecruiterSession(): Promise<RecruiterSession> {
  const store = await cookies();
  const id = store.get(RECRUITER_SESSION_COOKIE)?.value;
  if (id != null) {
    const match = KNOWN_RECRUITERS[id];
    if (match) return match;
  }
  return { ...DEMO_RECRUITER };
}
