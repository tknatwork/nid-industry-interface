// @nid/module-candidate-browse — public API.
//
// Cross-module imports MUST come through this file (enforced by dependency-cruiser).
// Guardrails (Phase 4.4) live in this module: no fit-score/cgpa/demographic sort,
// no bulk shortlist, note required, discipline-filtered, portfolio-first.

export {
  listEligibleCandidates,
  getCandidate,
  shortlistCandidate,
  unshortlistCandidate,
  listShortlist,
  isShortlisted,
  type EligibilityQuery,
} from './actions';

export type { CandidateView, CandidateSort, ShortlistEntry, ShortlistResult } from './types';
