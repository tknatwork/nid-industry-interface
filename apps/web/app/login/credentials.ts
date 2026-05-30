/**
 * Prefilled demo credentials for the login page (plan §H).
 *
 * The real II portal issues credentials to a recruiter only after the placement
 * cell approves their application — there is no public signup, and the
 * forgot-password page literally says "credentials are provided by NID after
 * sign-up". This pair stands in for the credentials Acme Design Studio
 * (NID-2026-A-0001, seeded `credentials-issued`) would have been emailed.
 *
 * Both the login form (to prefill the fields) and the server action (to check
 * the submission) import from here, so the demo can never drift into a state
 * where the visible defaults don't actually log in.
 *
 * Demo-only: this is not a secret and grants no real access — it merely flips
 * the prototype into its "logged-in recruiter" view. Kept in a plain (non
 * `'use server'`) module so the Client Component can import it.
 */

import { DEMO_RECRUITER } from '~/lib/demo-recruiter';

export const DEMO_LOGIN = {
  /** Recruiters log in with their corporate email — matches Acme's seeded record. */
  username: 'hire@acmedesign.example',
  /** Fixed demo password. Never a real credential. */
  password: 'spring-2026',
  /** The recruiter this credential pair resolves to. */
  recruiterId: DEMO_RECRUITER.recruiterId,
} as const;

/**
 * One credential pair per branch of a multi-branch company (plan Round 3 §D).
 * Acme Design Studio runs two branches, each a SEPARATE recruiter account with
 * its OWN corporate email and dashboard: signing in with either email logs in as
 * that branch. {@link DEMO_LOGIN} above stays the Bengaluru primary the login
 * form prefills; the server action checks the submission against EVERY entry
 * here so either branch resolves to its own recruiter id.
 *
 * Shared fixed demo password across branches — never a real credential.
 */
export interface DemoLogin {
  readonly label: string;
  readonly username: string;
  readonly password: string;
  readonly recruiterId: string;
}

export const DEMO_LOGINS: readonly DemoLogin[] = [
  {
    label: 'Acme Design Studio — Bengaluru',
    username: DEMO_LOGIN.username,
    password: DEMO_LOGIN.password,
    recruiterId: DEMO_LOGIN.recruiterId,
  },
  {
    label: 'Acme Design Studio — Ahmedabad',
    username: 'hire-ahm@acmedesign.example',
    password: 'spring-2026',
    recruiterId: 'NID-2026-A-0002',
  },
];
