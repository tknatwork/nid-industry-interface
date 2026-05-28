import type { CycleId, DisciplineId, JdId, RecruiterId } from './ids.js';

export type JdStatus = 'draft' | 'in-moderation' | 'published' | 'closed' | 'withdrawn';
export type RoleType = 'full-time' | 'vacation-internship' | 'during-course-internship';
export type WorkMode = 'onsite' | 'remote' | 'hybrid';

/**
 * Structured JD schema (Phase 4.2 — "ATS-for-JDs" inversion). Free-text prose
 * is allowed only as supplementary detail under structured fields.
 *
 * JDs are IMMUTABLE after publish. Any update creates a new JD with
 * `replacesJdId` pointing at the original.
 */
export interface Jd {
  readonly id: JdId;
  readonly recruiterId: RecruiterId;
  readonly cycleId: CycleId;
  readonly replacesJdId?: JdId;
  readonly status: JdStatus;

  readonly title: string;
  readonly roleType: RoleType;
  readonly location: string;
  readonly workMode: WorkMode;
  readonly positions: number;
  readonly targetStartDate?: Date;

  // Compensation (range for full-time, single value for internships)
  readonly baseMinPaise?: number;
  readonly baseMaxPaise?: number;
  readonly stipendPaise?: number;
  readonly variableComponent?: string;
  readonly equityComponent?: string;
  readonly joiningBonusPaise?: number;
  readonly relocationPaise?: number;

  // Structured fields
  readonly skillsRequired: ReadonlyArray<{ slug: string; name: string; required: boolean }>;
  readonly responsibilities: Readonly<Record<ResponsibilityCategory, readonly string[]>>;
  readonly deliverables: readonly string[];
  readonly supplementaryProseMd?: string;

  // Discipline mapping (admin-confirmed before publish)
  readonly targetDisciplineIds: readonly DisciplineId[];

  // Interview structure (required at posting)
  readonly interviewRounds: ReadonlyArray<{
    readonly round: number;
    readonly focus: string;
  }>;

  // Lifecycle timestamps
  readonly draftedAt: Date;
  readonly submittedAt?: Date;
  readonly publishedAt?: Date;
  readonly closedAt?: Date;
}

export type ResponsibilityCategory = 'discovery' | 'definition' | 'design' | 'delivery' | 'ops';
