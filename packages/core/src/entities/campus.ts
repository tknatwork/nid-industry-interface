import type { CampusId } from './ids';

/**
 * The 3 legacy DPIIT campuses served by this portal (per Phase 1.5 rescope).
 * The 4 bachelor-only campuses (NID AP, MP, Assam, Haryana) build their own
 * portals on top of the institution-side API and are NOT represented here.
 */
export type CampusCode = 'ahmedabad' | 'gandhinagar' | 'bengaluru';

export interface Campus {
  readonly id: CampusId;
  readonly code: CampusCode;
  readonly name: string;
  readonly programmesOffered: ReadonlyArray<'bachelors' | 'masters' | 'phd'>;
  readonly contactEmail: string;
  readonly placementHeadId?: string; // rotating role, persisted as dated record
  readonly active: boolean;
}
