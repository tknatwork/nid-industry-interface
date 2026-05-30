// @nid/module-recruiter-pipeline — public API.
//
// Forward-only linear stage machine + append-only audit log for the recruiter
// pipeline (Round 4 §B). Owns the linear stage + audit trail only; round
// results live in interview-console, offers in offer-cascade.

export {
  getStage,
  getPipeline,
  canAdvanceTo,
  advanceStage,
  appendAudit,
  listAudit,
  isPlanEditable,
} from './actions';

export { STAGE_ORDER, rankOf, planEditableAt } from './types';

export type {
  PipelineStage,
  PipelineState,
  AuditEntry,
  AuditAction,
  AdvanceOptions,
  AuditAppendInput,
  AdvanceResult,
} from './types';
