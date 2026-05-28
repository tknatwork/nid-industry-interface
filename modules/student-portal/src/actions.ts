import { getCandidate } from '@nid/module-candidate-browse';
import { listJdsByStatus, type JdRecord } from '@nid/module-jd-posting';
import { isOptedIn as storeIsOptedIn, setOptIn as storeSetOptIn } from './store';
import {
  optInSchema,
  type ActionResult,
  type EligibleJd,
  type StudentProfile,
} from './types';

/**
 * Demo company-name resolution. Company identity is owned by
 * recruiter-onboarding; once the DB lands, the eligible-JD read model joins
 * `jd.recruiter_id → recruiter.company_name`. Until then this map names the
 * seeded demo recruiter and falls back to the raw id.
 */
const COMPANY_NAMES: Readonly<Record<string, string>> = {
  'NID-2026-A-0001': 'Acme Design Studio',
};

function companyNameFor(recruiterId: string): string {
  return COMPANY_NAMES[recruiterId] ?? recruiterId;
}

/** Student's own profile (read model from the shared student roster). */
export function getStudentProfile(studentId: string): StudentProfile | null {
  const c = getCandidate(studentId);
  if (!c) return null;
  return {
    studentId: c.studentId,
    name: c.name,
    disciplineId: c.disciplineId,
    disciplineName: c.disciplineName,
    accent: c.accent,
    programme: c.programme,
    batchYear: c.batchYear,
    semester: c.semester,
    portfolioUrl: c.portfolioUrl,
    portfolioHost: c.portfolioHost,
  };
}

export function isOptedIn(studentId: string, cycleId: string): boolean {
  return storeIsOptedIn(studentId, cycleId);
}

/** Toggle the student's opt-in for a cycle. Parsed at the boundary. */
export function setCycleOptIn(input: unknown): ActionResult {
  const parsed = optInSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: parsed.error.issues[0]?.message ?? 'Invalid' };
  storeSetOptIn(parsed.data.studentId, parsed.data.cycleId, parsed.data.optedIn);
  return { ok: true };
}

/**
 * Published JDs this student is eligible to see (Phase 3.5 feed):
 *   status published  AND  student opted into the JD's cycle
 *   AND discipline ∈ targetDisciplineIds  AND programme ∈ targetProgrammes.
 * Mirrors the recruiter-side eligibility (Phase 4.4) from the student's angle.
 */
export function listEligibleJds(studentId: string, cycleId: string): readonly EligibleJd[] {
  const profile = getStudentProfile(studentId);
  if (!profile) return [];
  if (!storeIsOptedIn(studentId, cycleId)) return [];

  return listJdsByStatus('published')
    .filter(
      (jd) =>
        jd.cycleId === cycleId &&
        jd.targetDisciplineIds.includes(profile.disciplineId) &&
        jd.targetProgrammes.includes(profile.programme),
    )
    .map(toEligibleJd);
}

function toEligibleJd(jd: JdRecord): EligibleJd {
  return {
    jdId: jd.id,
    title: jd.title,
    companyName: companyNameFor(jd.recruiterId),
    roleType: jd.roleType,
    location: jd.location,
    workMode: jd.workMode,
    positions: jd.positions,
    baseMinPaise: jd.baseMinPaise,
    baseMaxPaise: jd.baseMaxPaise,
    stipendPaise: jd.stipendPaise,
    interviewRoundCount: jd.interviewRounds.length,
    publishedAt: jd.publishedAt,
  };
}

export { companyNameFor };
