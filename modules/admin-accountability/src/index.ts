// @nid/module-admin-accountability — public API.
//
// Cross-module imports MUST come through this file (enforced by the boundary
// harness). This module composes the pure health-score math from @nid/core
// with persisted accountability events + adjudication state (Phase 5.7–5.11).

export {
  listRecruiterScores,
  recruiterScoreDetail,
  listRedressal,
  getRedressalCase,
  decideRedressal,
  listBlacklist,
  addToBlacklist,
  liftBlacklist,
  listPaymentCases,
  decidePaymentCase,
  type RecruiterScoreDetail,
} from './actions';

export type {
  HealthEventRecord,
  RecruiterScore,
  RedressalCase,
  RedressalCategory,
  RedressalStatus,
  BlacklistEntry,
  PaymentCase,
  PaymentKind,
  PaymentStatus,
  ActionResult,
} from './types';
