// @nid/module-jd-posting — public API.
//
// Cross-module imports MUST come through this file (enforced by dependency-cruiser).

export {
  createDraft,
  updateDraft,
  discardDraft,
  submitForModeration,
  listForRecruiter,
  getJd,
  publishJd,
  holdJd,
  closeJd,
  withdrawJd,
  gateReportFor,
  gateReportForAsync,
  type DraftResult,
  type SubmitResult,
  type CreateDraftResult,
  type ValidationFailure,
  type UpdateDraftResult,
  type EditDraftResult,
  type DiscardDraftResult,
  type ActionFailure,
  type PublishResult,
} from './actions';

export {
  httpScopeAnalyzer,
  analyzeScopeForJd,
  scopeInputForJd,
} from './scope-analyzer';

export {
  jdDraftSchema,
  jdModerationSchema,
  programmeCompSchema,
  evaluationTaskSchema,
  type JdRecord,
  type JdDraftInput,
  type ProgrammeComp,
  type EvaluationTask,
  type GateFailure,
  type GateReport,
} from './types';

export { DISCIPLINES_REF, disciplineName, type DisciplineRef } from './disciplines-ref';

export {
  ROLE_WORK_REF,
  expectedWorkFor,
  isInternshipRoleType,
  type ExpectedWorkRef,
  type InternshipRoleType,
} from './role-work-ref';

export {
  CANONICAL_SKILLS,
  SKILL_GROUPS,
  skillLabel,
  isCanonicalSkill,
  type CanonicalSkill,
  type SkillGroup,
} from './skills';

export { floorPaiseFor, strictestFloorPaise, type Programme } from './stipend-floors';

export { listJdsByStatus } from './store';
