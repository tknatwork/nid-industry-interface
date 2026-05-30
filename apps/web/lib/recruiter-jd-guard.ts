/**
 * Recruiter ↔ JD ownership guard (server-only).
 *
 * A JD belongs to exactly one branch (recruiter account). Its id is sequential
 * and therefore guessable across branches — nothing stops the Ahmedabad branch
 * (NID-2026-A-0002) from typing the URL of a JD the Bengaluru branch
 * (NID-2026-A-0001) owns. So every JD detail page and every JD write action must
 * confirm the SESSION recruiter owns the JD before rendering or mutating it;
 * otherwise it 404s (we hide existence rather than leaking it with a 403).
 *
 * Server-only: `readRecruiterSession` reads `next/headers` cookies and `notFound`
 * is a Next.js navigation helper. Import from Server Components, Server Actions,
 * or Route Handlers — never from a Client Component.
 */

import 'server-only';
import { notFound } from 'next/navigation';
import { getJd, type JdRecord } from '@nid/module-jd-posting';
import { readRecruiterSession } from './recruiter-session';

/**
 * Loads a JD by id and asserts the current session recruiter owns it.
 *
 * Returns the {@link JdRecord} when the JD exists and its `recruiterId` matches
 * the session; otherwise calls {@link notFound} (which throws, so this never
 * returns for a missing or cross-branch JD).
 */
export async function requireOwnedJd(jdId: string): Promise<JdRecord> {
  const jd = getJd(jdId);
  const session = await readRecruiterSession();
  if (!jd || jd.recruiterId !== session.recruiterId) notFound();
  return jd;
}
