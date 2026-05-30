'use server';

import { redirect } from 'next/navigation';
import { setRecruiterSession } from '~/lib/recruiter-session';
import { DEMO_LOGINS } from './credentials';
import type { LoginFormState } from './state';

/**
 * Login server action (plan §H). Validates the submission against the prefilled
 * demo credentials, sets the demo session cookie via {@link setRecruiterSession},
 * then redirects into the recruiter dashboard.
 *
 * `redirect` throws to perform the navigation, so it must sit outside the
 * try/catch-free happy path's return — it never falls through to a return.
 */
export async function loginAction(
  _prev: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const username = String(formData.get('username') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  // Multi-branch (plan Round 3 §D): match the submission against ANY branch's
  // credentials. Case-insensitive on the email username; exact on the password.
  // The matched entry's recruiterId is what the session is set to, so logging in
  // as either Acme branch resolves to that branch's own dashboard.
  const match = DEMO_LOGINS.find(
    (login) =>
      username.toLowerCase() === login.username.toLowerCase() &&
      password === login.password,
  );

  if (!match) {
    return {
      status: 'error',
      message:
        'Those credentials don’t match our records. Use the prefilled demo credentials, or recover access via "Forgot password".',
    };
  }

  await setRecruiterSession(match.recruiterId);
  redirect('/recruiter/dashboard');
}
