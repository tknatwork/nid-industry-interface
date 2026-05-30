/**
 * Demo student-coordinator context — the placement-cell counterpart to
 * `demo-recruiter.ts`. Stands in for an authenticated `/admin` session scoped
 * to the **coordinator** role until the auth module lands.
 *
 * Per plan §Q (Round 2 — interview-day operations + scoped student-coordinator
 * access), the coordinator is the first RBAC subset of `/admin`: a placement-cell
 * member who manages only their *assigned* recruiting companies. This demo
 * identity is assigned to Acme Design Studio (NID-2026-A-0001) — filling the gap
 * the plan flags, where the seeded `COORDINATORS` directory in
 * `recruiter-public.ts` had no coordinator mapped to Acme.
 *
 * When auth ships, replace `DEMO_COORDINATOR` / `resolveAdminRole()` with reads
 * off the verified session, exactly as `DEMO_RECRUITER` will be replaced.
 */
export const DEMO_COORDINATOR = {
  coordinatorId: 'COORD-2026-A-01',
  // Single source of truth for the coordinator's display name — must match the
  // seeded directory record COORD-A-1 in recruiter-public.ts ('Aanya Kulkarni'),
  // which is what the coordinator banner (coordinatorDisplayName) and the
  // recruiter console (coordinatorForRecruiter) both render.
  name: 'Aanya Kulkarni',
  campus: 'Ahmedabad',
  assignedCompanies: ['NID-2026-A-0001'],
  cycleId: 'cycle_spring_2026',
} as const;

/**
 * The two `/admin` actor roles in the demo RBAC. `full-admin` is the placement
 * head with unrestricted `/admin` access; `coordinator` is scoped to their
 * `assignedCompanies` (deny everything else). Real auth will derive this from
 * the verified session's claims.
 */
export type AdminRole = 'full-admin' | 'coordinator';

/**
 * The default `/admin` actor for the demo. Most `/admin` surfaces render for the
 * full admin; coordinator-scoped routes (`/admin/coordinator/*`) flip this.
 */
export const DEFAULT_ADMIN_ROLE: AdminRole = 'full-admin';

/**
 * Resolves the current `/admin` actor's role. Demo constant now — mirrors the
 * `DEMO_RECRUITER` pattern — so coordinator-scoped pages can gate on it before
 * real auth exists.
 *
 * Demo escape hatch: `NID_DEMO_ADMIN_ROLE=coordinator` lets a reviewer preview
 * the coordinator-scoped shell without wiring auth. Anything other than the two
 * known roles falls back to {@link DEFAULT_ADMIN_ROLE}.
 *
 * When auth lands, this reads the role off the verified session instead of an
 * env var / constant.
 */
export function resolveAdminRole(): AdminRole {
  const override = process.env['NID_DEMO_ADMIN_ROLE'];
  if (override === 'coordinator' || override === 'full-admin') {
    return override;
  }
  return DEFAULT_ADMIN_ROLE;
}

/** True when the resolved `/admin` actor is the scoped student-coordinator. */
export function isCoordinator(role: AdminRole = resolveAdminRole()): boolean {
  return role === 'coordinator';
}

/**
 * Scope guard for coordinator reads/writes: a coordinator may only touch their
 * `assignedCompanies`; a full admin sees everything. Every coordinator-scoped
 * read/write should funnel through this so the demo enforces the §Q "deny
 * non-assigned companies" rule in one place.
 */
export function canCoordinatorAccessCompany(
  recruiterId: string,
  role: AdminRole = resolveAdminRole(),
): boolean {
  if (role === 'full-admin') return true;
  return (DEMO_COORDINATOR.assignedCompanies as readonly string[]).includes(recruiterId);
}

/**
 * The `AdminShell` `roleLabel` for the current actor — e.g.
 * "Student coordinator — NID Ahmedabad" for the scoped role, or undefined for
 * the full admin (which already labels itself elsewhere). Feeds the existing
 * `AdminShell.roleLabel` prop.
 */
export function adminRoleLabel(role: AdminRole = resolveAdminRole()): string | undefined {
  if (role === 'coordinator') {
    return `Student coordinator — NID ${DEMO_COORDINATOR.campus}`;
  }
  return undefined;
}
