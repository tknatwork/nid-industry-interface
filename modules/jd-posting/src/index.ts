// @nid/module-jd-posting — public API.
//
// Cross-module imports MUST come through this file (enforced by dependency-cruiser).

export {
  createDraft,
  submitForModeration,
  listForRecruiter,
  getJd,
  publishJd,
  holdJd,
  gateReportFor,
  type DraftResult,
  type SubmitResult,
  type CreateDraftResult,
  type ValidationFailure,
  type PublishResult,
} from './actions';

export {
  jdDraftSchema,
  jdModerationSchema,
  type JdRecord,
  type JdDraftInput,
  type GateFailure,
  type GateReport,
} from './types';

export { DISCIPLINES_REF, disciplineName, type DisciplineRef } from './disciplines-ref';

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
