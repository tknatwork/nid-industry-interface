import { z } from 'zod';

/**
 * Student-portal types. This is the student's self-service surface (Phase 3.5):
 * the only state this module *owns* is per-cycle opt-in. Profile + eligible-JD
 * data are read models composed from candidate-browse + jd-posting.
 */

export interface StudentProfile {
  readonly studentId: string;
  readonly name: string;
  readonly disciplineId: string;
  readonly disciplineName: string;
  readonly accent: 'red' | 'yellow' | 'cyan' | 'green' | 'purple' | 'navy';
  readonly programme: 'bachelors' | 'masters';
  readonly batchYear: number;
  readonly semester: number;
  readonly portfolioUrl: string;
  readonly portfolioHost: string;
}

/** A published JD a student is eligible to see, with the reason it matched. */
export interface EligibleJd {
  readonly jdId: string;
  readonly title: string;
  readonly companyName: string;
  readonly roleType: 'full-time' | 'vacation-internship' | 'during-course-internship';
  readonly location: string;
  readonly workMode: 'onsite' | 'remote' | 'hybrid';
  readonly positions: number;
  readonly baseMinPaise?: number | undefined;
  readonly baseMaxPaise?: number | undefined;
  readonly stipendPaise?: number | undefined;
  readonly interviewRoundCount: number;
  readonly publishedAt?: string | undefined;
}

export const optInSchema = z.object({
  studentId: z.string().min(1),
  cycleId: z.string().min(1),
  optedIn: z.coerce.boolean(),
});

export const respondToOfferSchema = z.object({
  jdId: z.string().min(1),
  studentId: z.string().min(1),
  decision: z.enum(['accepted', 'declined']),
  reason: z.string().trim().max(280).optional(),
});

export interface ActionResult {
  readonly ok: boolean;
  readonly reason?: string;
}
