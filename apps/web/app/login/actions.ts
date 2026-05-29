'use server';

import { redirect } from 'next/navigation';
import { setRecruiterSession } from '~/lib/recruiter-session';
import { DEMO_LOGIN } from './credentials';
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

  // Case-insensitive on the email username; exact on the password.
  const ok =
    username.toLowerCase() === DEMO_LOGIN.username.toLowerCase() &&
    password === DEMO_LOGIN.password;

  if (!ok) {
    return {
      status: 'error',
      message:
        'Those credentials don’t match our records. Use the prefilled demo credentials, or recover access via "Forgot password".',
    };
  }

  await setRecruiterSession(DEMO_LOGIN.recruiterId);
  redirect('/recruiter/dashboard');
}
