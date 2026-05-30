/**
 * Role-type → expected-work reference (Round 2 §N).
 *
 * Internship-specific. When a recruiter picks an internship role-type in the
 * wizard, the UI surfaces "what a student is realistically expected to do" for
 * that role-type — so the JD's responsibilities/deliverables are calibrated to
 * what NID interns actually deliver, and the institute's time/effort
 * expectations are explicit up front.
 *
 * Seed data for this slice. Moves to an admin-editable table when the DB lands,
 * the same swap-later pattern as skills.ts / stipend-floors.ts. Full-time is
 * deliberately NOT modelled here — the institute calibrates expected work only
 * for internships, where the GP-fee / mentorship framing applies.
 */

import type { RoleType } from '@nid/core';

/** The internship role-types this reference covers (full-time excluded). */
export type InternshipRoleType = Extract<
  RoleType,
  'vacation-internship' | 'during-course-internship'
>;

export interface ExpectedWorkRef {
  readonly roleType: InternshipRoleType;
  /** Short human label for the role-type, for headings. */
  readonly label: string;
  /** Indicative time commitment the institute frames for this role-type. */
  readonly timeCommitment: string;
  /** What a student is realistically expected to do — calibration points. */
  readonly expectedWork: readonly string[];
  /** What this role-type is NOT (guards against scope creep at authoring). */
  readonly notExpected: readonly string[];
}

export const ROLE_WORK_REF: readonly ExpectedWorkRef[] = [
  {
    roleType: 'vacation-internship',
    label: 'Vacation internship',
    timeCommitment: 'Full-time during the semester break (typically 6–10 weeks)',
    expectedWork: [
      'Own a scoped, time-boxed project end to end under a mentor',
      'Produce a portfolio-grade deliverable the studio can actually use',
      'Participate in studio rituals (critiques, stand-ups, reviews)',
      'Present the project at an end-of-internship review',
    ],
    notExpected: [
      'Sole responsibility for a production launch',
      'On-call or after-hours availability',
      'Output volume equivalent to a full-time hire',
    ],
  },
  {
    roleType: 'during-course-internship',
    label: 'During-course internship',
    timeCommitment: 'Part-time alongside coursework (max ~20 hrs/week)',
    expectedWork: [
      'Contribute to a defined slice of a live project within a capped weekly load',
      'Deliver against a clear, bounded brief reviewed by a mentor',
      'Coordinate handoffs so coursework deadlines are not displaced',
      'Document work so it survives the limited weekly hours',
    ],
    notExpected: [
      'A full-time workload or fixed daily office hours',
      'Travel or relocation during the academic term',
      'Ownership of timelines that conflict with the academic calendar',
    ],
  },
];

const BY_ROLE_TYPE = new Map<InternshipRoleType, ExpectedWorkRef>(
  ROLE_WORK_REF.map((r) => [r.roleType, r]),
);

/** True when a role-type has an expected-work reference (i.e. it's an internship). */
export function isInternshipRoleType(roleType: RoleType): roleType is InternshipRoleType {
  return roleType === 'vacation-internship' || roleType === 'during-course-internship';
}

/**
 * Expected-work reference for a role-type. Returns null for full-time (which is
 * deliberately not modelled) so callers can branch without a thrown error.
 */
export function expectedWorkFor(roleType: RoleType): ExpectedWorkRef | null {
  return isInternshipRoleType(roleType) ? (BY_ROLE_TYPE.get(roleType) ?? null) : null;
}
