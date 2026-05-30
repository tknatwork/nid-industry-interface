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
  /**
   * Optional direct CV link. When present the recruiter can open the CV from the
   * Interview "Before" phase (§R); absent for students whose CV hasn't been
   * supplied yet (`cvAvailable` may still be true once the ingest lands).
   */
  readonly cvUrl?: string;
  /**
   * Optional presentation deck for interview rounds (§R). "Presentations" reuse
   * the candidate portfolio; this is the extra deck link a student attaches for
   * the interview, surfaced in the Interview Before/After phases. Link-out, not embed.
   */
  readonly presentationUrl?: string;
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
