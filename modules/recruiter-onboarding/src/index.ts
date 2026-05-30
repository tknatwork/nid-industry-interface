// @nid/module-recruiter-onboarding — public API.
//
// Cross-module imports MUST come through this file. No deep imports
// (e.g. ./store.js) from outside the module. This is enforced by the
// dependency-cruiser harness at the root.

export {
  submit,
  lookup,
  outboxFor,
  listAll,
  listOutboxAll,
  advance,
  pay,
  updateContactDetails,
  getCompanyRecord,
  getAccountState,
  isAccountLocked,
  windDownCycle,
  reactivateForCycle,
  queueOfferLetterNotice,
} from './actions';
export type {
  SubmitApplyResult,
  SubmitOutcome,
  SubmitFailure,
  UpdateContactResult,
  ReactivateOutcome,
} from './actions';
export {
  applyFormSchema,
  recruiterStatusSchema,
  recruiterStatusValues,
  type AccountActivationRecord,
  type ApplyForm,
  type ApplicationTicketRecord,
  type OutboxMessage,
  type PaymentReceipt,
  type RecruiterStatus,
  type StatusHistoryEntry,
} from './types';
export { parseTicketId, formatTicketId } from './tokens';
