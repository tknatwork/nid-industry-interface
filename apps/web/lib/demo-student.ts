/**
 * Demo student context — stands in for an authenticated student session until
 * SSO from nid.edu lands. The student portal acts as this student.
 *
 * Aanya Roy (stu_0005) is seeded across three stores for a coherent demo:
 *   - student-portal: opted into Spring 2026
 *   - candidate-browse: shortlisted by Acme against the published jd_00001
 *   - offer-cascade: holds a pending Wave-1 offer for jd_00001
 *
 * So the offer inbox lands populated and accept/decline drives the real cascade.
 *
 * When auth ships, replace every import of DEMO_STUDENT with a call that reads
 * the student id from the verified session.
 */
export const DEMO_STUDENT = {
  studentId: 'stu_0005',
  cycleId: 'cycle_spring_2026',
  cycleName: 'Spring 2026',
} as const;
