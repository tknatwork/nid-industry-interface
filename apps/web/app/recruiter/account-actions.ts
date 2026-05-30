'use server';

/**
 * Recruiter account server actions (plan §L). Today this is just logout; the
 * account menu in the shell header calls it from a tiny `<form action={...}>`.
 *
 * Logout clears the demo session cookie via {@link clearRecruiterSession} and
 * redirects to the login page. When real auth lands, only `recruiter-session`
 * changes — this action keeps the same shape.
 */

import { redirect } from 'next/navigation';
import { clearRecruiterSession } from '~/lib/recruiter-session';

/** Clears the demo recruiter session and sends the user back to the login page. */
export async function logoutAction(): Promise<void> {
  await clearRecruiterSession();
  redirect('/login');
}
