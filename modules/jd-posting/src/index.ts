// @nid/module-jd-posting — public API.
//
// Cross-module imports MUST come through this file (enforced by dependency-cruiser).

export {
  createDraft,
  submitForModeration,
  listForRecruiter,
  getJd,
  type DraftResult,
  type SubmitResult,
  type CreateDraftResult,
  type ValidationFailure,
} from './actions';

export {
  jdDraftSchema,
  jdModerationSchema,
  type JdRecord,
  type JdDraftInput,
  type GateFailure,
} from './types';

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
