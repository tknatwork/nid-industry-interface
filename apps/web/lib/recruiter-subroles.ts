/**
 * Recruiter sub-roles — single company account, named people (plan §recruiter
 * sub-roles, §P).
 *
 * "One company account per recruiter, not separate accounts per person. Inside
 * the account, named sub-roles exist: HR Director, Hiring Manager, Interviewer —
 * each with their own contact number visible to the placement cell." Comms can
 * be routed to a specific sub-role, and a candidate's interview slot draws its
 * expected interviewers from this list (slots page → `assignInterviewers`).
 *
 * Presentation-only demo data scoped to the seeded recruiter (DEMO_RECRUITER →
 * Acme Design Studio). In production this is the company's own roster, managed
 * under /recruiter/settings (users on your account). Kept static so the slots
 * page stays a store-free server component.
 *
 * When auth + a real roster land, replace `SUB_ROLES_FOR_DEMO_RECRUITER` with a
 * lookup keyed by the verified recruiter id.
 */

import { DEMO_RECRUITER } from './demo-recruiter';

/** The three named sub-roles a recruiter account carries (plan §recruiter sub-roles). */
export type SubRoleTitle = 'HR Director' | 'Hiring Manager' | 'Interviewer';

export interface RecruiterSubRole {
  /** Stable id (`SR-<n>`), used as the option value in the interviewer picker. */
  readonly id: string;
  /** The named person holding this sub-role. */
  readonly name: string;
  readonly title: SubRoleTitle;
  /** Contact number visible to the placement cell (plan §recruiter sub-roles). */
  readonly phone: string;
}

/**
 * Acme Design Studio's roster (NID-2026-A-0001). One person per sub-role for the
 * demo; a real account may carry several Interviewers.
 */
export const SUB_ROLES_FOR_DEMO_RECRUITER: readonly RecruiterSubRole[] = [
  { id: 'SR-1', name: 'Priya Menon', title: 'HR Director', phone: '+91 98200 11001' },
  { id: 'SR-2', name: 'Arjun Rao', title: 'Hiring Manager', phone: '+91 98200 11002' },
  { id: 'SR-3', name: 'Neha Verma', title: 'Interviewer', phone: '+91 98200 11003' },
  { id: 'SR-4', name: 'Vikram Shah', title: 'Interviewer', phone: '+91 98200 11004' },
];

/**
 * Resolve a recruiter's sub-roles by id. Returns the demo roster for the seeded
 * recruiter, otherwise an empty list (no other recruiter is seeded in the demo).
 */
export function subRolesForRecruiter(recruiterId: string): readonly RecruiterSubRole[] {
  return recruiterId === DEMO_RECRUITER.recruiterId ? SUB_ROLES_FOR_DEMO_RECRUITER : [];
}

/** Compact label for a sub-role chip / option: "Priya Menon · HR Director". */
export function subRoleLabel(role: RecruiterSubRole): string {
  return `${role.name} · ${role.title}`;
}

/** Resolve a set of sub-role ids to their display labels, preserving roster order. */
export function labelsForSubRoleIds(
  ids: readonly string[],
  roster: readonly RecruiterSubRole[] = SUB_ROLES_FOR_DEMO_RECRUITER,
): readonly string[] {
  const wanted = new Set(ids);
  return roster.filter((r) => wanted.has(r.id)).map(subRoleLabel);
}
