/**
 * Demo recruiter context — stands in for an authenticated session until the
 * auth module lands. The recruiter portal acts as this company.
 *
 * Acme Design Studio (NID-2026-A-0001) is seeded in `credentials-issued`
 * state by the recruiter-onboarding module, so it is a valid "logged-in"
 * recruiter for the demo.
 *
 * When auth ships, replace every import of DEMO_RECRUITER with a call that
 * reads the recruiter id from the verified session.
 */
export const DEMO_RECRUITER = {
  recruiterId: 'NID-2026-A-0001',
  companyName: 'Acme Design Studio',
  cycleId: 'cycle_spring_2026',
} as const;
