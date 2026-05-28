import type { CampusId, DisciplineId } from './ids';

/**
 * NID discipline taxonomy. Admin-edited, versioned (Phase 6.10).
 * Public catalog at /disciplines/* — fully indexed, no marketing-window gating.
 */
export interface Discipline {
  readonly id: DisciplineId;
  readonly slug: string;
  readonly name: string;
  readonly descriptionMd: string;
  readonly campusIds: readonly CampusId[]; // disciplines may exist at multiple campuses
  readonly programme: 'bachelors' | 'masters' | 'both';
  readonly version: number;
  readonly accentTokenName: 'red' | 'yellow' | 'cyan' | 'green' | 'purple' | 'navy';
  readonly active: boolean;
}

/**
 * Job-title-to-discipline canonical map (Phase 6.10 governance).
 * Grows over time as admin promotes AI-proposed mappings.
 */
export interface JobTitleMapping {
  readonly rawTitle: string;
  readonly targetDisciplineIds: readonly DisciplineId[];
  readonly source: 'canonical' | 'ai-proposed' | 'admin-approved';
  readonly confidence: number;
  readonly version: number;
}
