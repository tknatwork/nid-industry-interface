/**
 * Candidate-browse types. The sort union is deliberately narrow — there is no
 * cgpa / fit-score / demographic option, by design (Phase 4.4 guardrail).
 */

export type CandidateSort = 'name' | 'discipline' | 'batch';

export interface CandidateView {
  readonly studentId: string;
  readonly name: string;
  readonly disciplineId: string;
  readonly disciplineName: string;
  /** Accent token key for the discipline-colored placeholder tile. */
  readonly accent: 'red' | 'yellow' | 'cyan' | 'green' | 'purple' | 'navy';
  readonly programme: 'bachelors' | 'masters';
  readonly batchYear: number;
  readonly semester: number;
  /** External portfolio (Behance / Issuu / personal) — link-out, not embed. */
  readonly portfolioUrl: string;
  readonly portfolioHost: string;
  readonly cvAvailable: boolean;
  readonly statementOfIntent?: string;
  // NOTE: no gender / region / caste / religion / cgpa / fitScore fields. Intentional.
}

export interface ShortlistEntry {
  readonly jdId: string;
  readonly studentId: string;
  readonly note: string; // non-empty enforced
  readonly shortlistedAt: string;
}

export interface ShortlistResult {
  readonly ok: boolean;
  readonly reason?: string;
}
