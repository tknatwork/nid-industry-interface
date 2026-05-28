import type { CampusId, CycleId, DisciplineId, StudentId } from './ids';

export interface Student {
  readonly id: StudentId;
  readonly campusId: CampusId;
  readonly disciplineId: DisciplineId;
  readonly programme: 'bachelors' | 'masters';
  readonly semester: number;
  readonly batchYear: number;
  readonly name: string;
  readonly email: string;
  readonly portfolioUrl?: string; // points to portfolio.nid.edu or external (Behance, etc.)
  readonly cvUrl?: string; // stored on our CDN
  readonly cgpa?: number;
  readonly hasPpoLock: boolean;
}

/**
 * Per-cycle opt-in (Phase 2 principle 5 — student opt-in is enforced).
 */
export interface StudentCycleOptIn {
  readonly studentId: StudentId;
  readonly cycleId: CycleId;
  readonly optedInAt: Date;
  readonly codeOfConductAccepted: boolean;
  readonly codeOfConductAcceptedAt?: Date;
}

/**
 * Student conduct record (Phase 5.10 post-acceptance accountability).
 * Visible to future-cycle recruiters in aggregate as a transparency signal,
 * NOT a punitive flag. Student can appeal at /student/conduct.
 */
export interface StudentConductEntry {
  readonly studentId: StudentId;
  readonly cycleId: CycleId;
  readonly type: 'offer-acceptance' | 'no-show' | 'ghost-after-acceptance' | 'breach-of-conduct';
  readonly severity: 'info' | 'warning' | 'reduced-visibility' | 'ineligible-next-cycle';
  readonly rationale: string;
  readonly recordedAt: Date;
  readonly appealStatus?: 'open' | 'reviewing' | 'upheld' | 'overturned';
}
