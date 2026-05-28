import type { CampusId, CycleId, DisciplineId } from './ids';

export type CycleStatus = 'draft' | 'open' | 'in-progress' | 'closing' | 'closed' | 'archived';

/**
 * The placement cycle is the central organizing object. Everything is
 * cycle-native (Phase 2 principle 2): config, dates, fees, comms templates,
 * stipend floors, eligibility rules all live per-cycle in the DB.
 */
export interface Cycle {
  readonly id: CycleId;
  readonly name: string; // e.g. "Spring 2026"
  readonly campusIds: readonly CampusId[];
  readonly status: CycleStatus;

  // Timeline
  readonly openDate: Date;
  readonly jdUploadDeadline: Date;
  readonly browseWindowOpens: Date;
  readonly shortlistDeadline: Date;
  readonly interviewWindowStart: Date;
  readonly interviewWindowEnd: Date;
  readonly offerDeadline: Date;
  readonly waveTimeWindowDays: number; // default 7, per Phase 4.8 wave cascade
  readonly archiveDate: Date;

  // Fees
  readonly participationFeePaise: number;
  readonly gpFeePerInternPaise: number; // ₹5,000 default
  readonly lateRegistrationFeePaise?: number;
}

/**
 * Per-cycle per-programme-per-role-type stipend floor matrix (Phase 5.3).
 * Both endpoints of a salary range must clear the floor for full-time.
 */
export interface StipendFloorRule {
  readonly cycleId: CycleId;
  readonly disciplineIds: readonly DisciplineId[];
  readonly programme: 'bachelors' | 'masters';
  readonly roleType: 'full-time' | 'vacation-internship' | 'during-course-internship';
  readonly floorPaise: number;
}

/**
 * Eligibility rules per cycle (Phase 5.3). Data-driven, never hardcoded.
 */
export interface EligibilityRule {
  readonly cycleId: CycleId;
  readonly disciplineIds: readonly DisciplineId[];
  readonly minSemester?: number;
  readonly maxSemester?: number;
  readonly minCgpa?: number;
  readonly ppoLockExempt: boolean;
  readonly customJson?: string;
}
