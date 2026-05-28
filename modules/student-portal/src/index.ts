// @nid/module-student-portal — public API.
//
// Cross-module imports MUST come through this file (enforced by dependency-cruiser).
// This module is the student's self-service surface (Phase 3.5). It OWNS only the
// per-cycle opt-in; profile + eligible-JD data are read models composed from the
// recruiter-side modules. The application tracker + offer inbox are composed at
// the page level (the composition-root pattern), the same way the recruiter
// offers page composes shortlist + offers.

export {
  getStudentProfile,
  isOptedIn,
  setCycleOptIn,
  listEligibleJds,
  companyNameFor,
} from './actions';

export {
  optInSchema,
  respondToOfferSchema,
  type StudentProfile,
  type EligibleJd,
  type ActionResult,
} from './types';
